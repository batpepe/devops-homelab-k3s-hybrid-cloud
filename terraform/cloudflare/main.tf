# Cloudflare control plane for batpepe.online: tunnel routing, DNS, Access.
# Separate root module on purpose: terraform/ (AWS) defines an EC2 that is
# currently destroyed, so a plain apply there would re-create it and resume
# billing. Applying this module can never touch AWS.
#
# Auth: export CLOUDFLARE_API_TOKEN before running terraform here.

variable "cloudflare_account_id" {
  description = "Cloudflare account ID (zone Overview page, API section)"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Zone ID for batpepe.online (zone Overview page, API section)"
  type        = string
}

locals {
  domain    = "batpepe.online"
  tunnel_id = "06f3a64a-4d7b-4c91-b706-aed3a9f53bc9"

  # CNAME target every tunnel-routed hostname points at.
  tunnel_cname = "${local.tunnel_id}.cfargotunnel.com"

  # The DNS record set is the public allowlist: a hostname is reachable from
  # the internet if and only if it is listed here. Per-host routing happens
  # in-cluster via Traefik Ingress rules (k8s-infrastructure/apps/*).
  tunnel_hosts = toset([
    "cv",
    "game",
    "museum",
    # Imported only to retire it: nodejs has no auth and stays LAN-only.
    # Cutover done (2026-06-17); removing "api" deletes its live DNS record,
    # so do it in a deliberate apply - tracked in ROADMAP.md.
    "api",
  ])
}

provider "cloudflare" {}

# Remote-managed tunnel configuration. One wildcard rule sends every
# *.batpepe.online hostname to Traefik inside the cluster; Ingress objects
# decide per-host routing. cloudflared runs in-cluster, so cluster DNS
# resolves the Traefik service name.
resource "cloudflare_zero_trust_tunnel_cloudflared_config" "homelab" {
  account_id = var.cloudflare_account_id
  tunnel_id  = local.tunnel_id

  config = {
    ingress = [
      {
        hostname = "*.${local.domain}"
        service  = "http://traefik.kube-system.svc.cluster.local:80"
      },
      # The wildcard does not match the zone apex, so the portal at
      # batpepe.online needs its own rule ahead of the 404 catch-all.
      {
        hostname = local.domain
        service  = "http://traefik.kube-system.svc.cluster.local:80"
      },
      {
        service = "http_status:404"
      },
    ]
  }
}

resource "cloudflare_dns_record" "tunnel" {
  for_each = local.tunnel_hosts

  zone_id = var.cloudflare_zone_id
  name    = "${each.key}.${local.domain}"
  type    = "CNAME"
  content = local.tunnel_cname
  proxied = true
  ttl     = 1 # 1 = automatic; the field is required in provider v5
}

# The apex portal (apps/portal). Deliberately NOT in tunnel_hosts: the
# for_each name expression cannot express the zone root, and a separate
# resource keeps existing record addresses untouched. Cloudflare flattens
# the proxied apex CNAME automatically.
resource "cloudflare_dns_record" "apex" {
  zone_id = var.cloudflare_zone_id
  name    = local.domain
  type    = "CNAME"
  content = local.tunnel_cname
  proxied = true
  ttl     = 1
}

output "tunnel_cname" {
  value       = local.tunnel_cname
  description = "CNAME target for any new public hostname (see tunnel_hosts)"
}
