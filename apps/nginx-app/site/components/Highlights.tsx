import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";

const FEATURES = [
  {
    title: "GitOps delivery",
    body: "ArgoCD reconciles the whole cluster from Git: an App-of-Apps root with pruning and self-healing on. Out-of-band kubectl edits get reverted.",
    tags: "argocd · app-of-apps"
  },
  {
    title: "Infrastructure as Code",
    body: "The AWS side (EC2, security groups) is provisioned with Terraform and configured with Ansible. Cloudflare tunnel routing and DNS are Terraform-managed too.",
    tags: "terraform · ansible · aws"
  },
  {
    title: "Pipelines with teeth",
    body: "GitHub Actions builds every app uncached, scans images with Trivy (the build fails on CRITICAL/HIGH CVEs), pushes to GHCR and pins the new immutable SHA into the manifest itself.",
    tags: "github-actions · trivy · ghcr"
  },
  {
    title: "Observability",
    body: "kube-prometheus-stack with custom PromQL alert rules, Loki for logs and Blackbox probing the public endpoints; firing alerts are routed to Telegram.",
    tags: "prometheus · loki · alertmanager"
  },
  {
    title: "Zero-port edge",
    body: "No port-forwarding at home: public traffic enters through a Cloudflare Tunnel terminated in-cluster, Traefik routes per host, and a Terraform DNS allowlist decides what is public at all.",
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
    <section id="platform" className="scroll-mt-16 border-t border-line/70">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <SectionHeader
          tag="platform"
          title="The platform behind this page"
          intro="Everything below is real, runs 24/7 and is defined in a single Git repository."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 80} className="h-full">
              <article className="glass glow-card h-full p-6">
                <h3 className="font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm text-sub">{f.body}</p>
                <p className="mt-4 font-mono text-xs text-cyan">{f.tags}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
