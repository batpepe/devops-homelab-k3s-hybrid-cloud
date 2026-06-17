#!/usr/bin/env bash
# One-off: add the museum.batpepe.online ingress rule to the live k3s-homelab
# tunnel config via the Cloudflare API, preserving every existing rule.
# It does NOT touch Zero Trust plan/onboarding and does NOT use terraform
# (terraform's config is a wildcard->Traefik design that would break api.*).
#
# Usage:
#   export CLOUDFLARE_API_TOKEN='<token with Account > Cloudflare Tunnel > Edit>'
#   bash terraform/cloudflare/add-museum-route.sh
#
# The token is the same one your terraform/cloudflare module uses. Set it only
# in your shell - never paste it into chat. Requires: curl, jq.
set -euo pipefail

ACCT="dcc65ed92d472d3f8d09d1451e7cd34b"
TUN="06f3a64a-4d7b-4c91-b706-aed3a9f53bc9"
HOST="museum.batpepe.online"
SVC="http://batman-museum-svc.apps.svc.cluster.local:80"
API="https://api.cloudflare.com/client/v4/accounts/${ACCT}/cfd_tunnel/${TUN}/configurations"

: "${CLOUDFLARE_API_TOKEN:?set CLOUDFLARE_API_TOKEN in your shell first}"
command -v jq >/dev/null || { echo "jq is required"; exit 1; }

auth=(-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}")

echo ">> preflight: verify token"
vt="$(curl -sS "${auth[@]}" "https://api.cloudflare.com/client/v4/user/tokens/verify")"
echo "$vt" | jq -e '.success' >/dev/null \
  && echo "token status: $(echo "$vt" | jq -r '.result.status')" \
  || { echo "token verify failed:"; echo "$vt" | jq -c '.errors'; exit 1; }

echo ">> preflight: list tunnels (confirm id/name + account perms)"
tl="$(curl -sS "${auth[@]}" "https://api.cloudflare.com/client/v4/accounts/${ACCT}/cfd_tunnel?is_deleted=false")"
echo "$tl" | jq -e '.success' >/dev/null \
  || { echo "cannot list tunnels (token lacks Account>Cloudflare Tunnel, or wrong account):"; echo "$tl" | jq -c '.errors'; exit 1; }
echo "$tl" | jq -r '.result[] | "  \(.id)  \(.name)"'
echo "$tl" | jq -e --arg t "$TUN" '.result[] | select(.id==$t)' >/dev/null \
  || { echo "WARNING: tunnel id $TUN not found in this account. Pick the right id from the list above and rerun."; exit 1; }

echo ">> fetching current tunnel config"
cur="$(curl -sS "${auth[@]}" "$API")"
echo "$cur" | jq -e '.success' >/dev/null || { echo "GET failed:"; echo "$cur" | jq -c '.errors'; exit 1; }
echo "current hostnames: $(echo "$cur" | jq -c '[.result.config.ingress[].hostname // "catch-all"]')"

# Rebuild ingress: keep all other hostname rules, drop any stale museum rule,
# append the museum rule, then re-append the catch-all (rule without hostname).
newcfg="$(echo "$cur" | jq \
  --arg h "$HOST" --arg s "$SVC" '
  .result.config
  | .ingress = (
      ( .ingress | map(select(.hostname and .hostname != $h)) )
      + [ { "hostname": $h, "service": $s } ]
      + ( .ingress | map(select(has("hostname") | not)) )
    )
')"

echo ">> new ingress to be applied:"
echo "$newcfg" | jq '.ingress'

echo ">> PUT updated config"
body="$(jq -nc --argjson c "$newcfg" '{config: $c}')"
resp="$(curl -sS -X PUT "${auth[@]}" -H "Content-Type: application/json" --data "$body" "$API")"
echo "$resp" | jq -e '.success' >/dev/null || { echo "PUT failed:"; echo "$resp" | jq -c '.errors'; exit 1; }
echo ">> tunnel config updated (new version: $(echo "$resp" | jq -r '.result.version'))"

echo ">> verifying public reachability"
sleep 3
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 \
  --resolve "${HOST}:443:104.21.64.118" "https://${HOST}/api/health" || true)"
echo "https://${HOST}/api/health -> ${code} (expect 200)"
