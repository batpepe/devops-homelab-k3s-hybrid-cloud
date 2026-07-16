import SectionHeader from "@/components/SectionHeader";

const FEATURES = [
  {
    title: "GitOps delivery",
    body: "ArgoCD reconciles the whole cluster from Git: 11 applications under an App-of-Apps root, with pruning and self-healing on. Out-of-band kubectl edits get reverted.",
    tags: "argocd · app-of-apps"
  },
  {
    title: "Infrastructure as Code",
    body: "The AWS side (EC2, security groups) is provisioned with Terraform and configured with Ansible. Cloudflare tunnel routing and DNS are Terraform-managed too.",
    tags: "terraform · ansible · aws"
  },
  {
    title: "CI/CD pipeline",
    body: "GitHub Actions builds every app, scans images with Trivy (the build fails on CRITICAL/HIGH CVEs), pushes to GHCR and commits the new tag back to the manifest. Image tags are immutable commit SHAs.",
    tags: "github-actions · trivy · ghcr"
  },
  {
    title: "Observability",
    body: "kube-prometheus-stack with custom PromQL alert rules; firing alerts are routed to Telegram through Alertmanager with a custom template.",
    tags: "prometheus · grafana · alertmanager"
  },
  {
    title: "Edge and security",
    body: "No port-forwarding at home: public traffic enters through a Cloudflare Tunnel terminated in-cluster, and Traefik routes per host. Secrets never touch Git.",
    tags: "cloudflare-tunnel · traefik"
  },
  {
    title: "Data services",
    body: "PostgreSQL 15 backs the apps, including the visit counter on this page; MinIO provides S3-compatible object storage. Both are PVC-backed.",
    tags: "postgresql · minio"
  }
];

export default function Highlights() {
  return (
    <section id="platform" className="scroll-mt-8 border-b border-surface0">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <SectionHeader
          tag="platform"
          title="The platform behind this page"
          intro="Everything below is real, runs 24/7 and is defined in a single Git repository."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="rounded-lg border border-surface0 bg-mantle p-5 hover:border-blue transition-colors"
            >
              <h3 className="font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-sub">{f.body}</p>
              <p className="mt-4 font-mono text-xs text-teal">{f.tags}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
