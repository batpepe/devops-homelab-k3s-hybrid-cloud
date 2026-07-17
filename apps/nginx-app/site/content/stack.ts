export interface StackTool {
  name: string;
  why: string;
}

export interface StackGroup {
  title: string;
  tag: string;
  tools: StackTool[];
}

export const STACK: StackGroup[] = [
  {
    title: "Infrastructure as Code",
    tag: "provision",
    tools: [
      { name: "Terraform", why: "Two independent root modules: AWS compute and the Cloudflare edge, so applying one can never touch the other." },
      { name: "Ansible", why: "Host bootstrap as a playbook: Docker, nginx and hardening land the same way every time." },
      { name: "AWS (eu-central-1)", why: "A disposable EC2 leg of the hybrid setup; destroyed when idle because the config, not the box, is the asset." }
    ]
  },
  {
    title: "Platform",
    tag: "run",
    tools: [
      { name: "K3s", why: "Full Kubernetes API at homelab weight; one binary, real CRDs, no compromises that matter here." },
      { name: "ArgoCD", why: "App-of-apps GitOps with prune and self-heal: the cluster state converges to git, drift gets reverted." },
      { name: "Traefik", why: "K3s' bundled ingress does all per-host routing; the tunnel just hands it everything." },
      { name: "Helm", why: "Only for upstream charts like kube-prometheus-stack; my own workloads stay plain manifests." }
    ]
  },
  {
    title: "Delivery",
    tag: "ship",
    tools: [
      { name: "GitHub Actions", why: "Per-app pipelines with path filters; the workflow that builds an image also writes its SHA into the manifest." },
      { name: "GHCR", why: "Images live next to the code that builds them; every tag is an immutable commit SHA." },
      { name: "Trivy", why: "The gate between build and deploy: CRITICAL/HIGH findings block, and uncached builds keep the scan honest." },
      { name: "hadolint + kube-linter", why: "Dockerfiles and manifests get linted in CI so review comments become machine checks." }
    ]
  },
  {
    title: "Observability",
    tag: "watch",
    tools: [
      { name: "kube-prometheus-stack", why: "Metrics, dashboards and alerting as one chart; alert rules are diffs in the repo." },
      { name: "Loki", why: "Logs queryable next to metrics in Grafana without running an ELK-sized stack." },
      { name: "Blackbox exporter", why: "Probes the public endpoints from outside the workloads, so 'up' means what users mean by it." },
      { name: "Uptime Kuma + Telegram", why: "A second, independent opinion on availability, and alerts that reach my pocket." }
    ]
  },
  {
    title: "Edge and security",
    tag: "protect",
    tools: [
      { name: "Cloudflare Tunnel", why: "Outbound-only connectivity: the cluster dials out, home has zero open inbound ports." },
      { name: "DNS allowlist (Terraform)", why: "A hostname is public if and only if its record is in one reviewed list." },
      { name: "Pi-hole", why: "LAN DNS with ad blocking; also how *.local hostnames resolve to the cluster." },
      { name: "Vaultwarden", why: "Self-hosted password manager; secrets for the cluster itself stay out of git entirely." }
    ]
  },
  {
    title: "Data and runtimes",
    tag: "store",
    tools: [
      { name: "PostgreSQL 15", why: "One instance, separate databases per app, idempotent boot migrations instead of migration ceremony." },
      { name: "MinIO", why: "S3-compatible object storage for anything that outgrows a PVC." },
      { name: "Next.js / Node / Flask", why: "Static export where possible, a thin API where needed, a sample service for alert drills." }
    ]
  }
];
