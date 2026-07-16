import SectionHeader from "@/components/SectionHeader";

const ITEMS = [
  {
    title: "museum.batpepe.online",
    href: "https://museum.batpepe.online",
    body: "Interactive 3D Batman museum: Next.js + React Three Fiber + PostgreSQL, running as a first-class workload with its own CI pipeline.",
    tags: "next.js · r3f · postgres"
  },
  {
    title: "game.batpepe.online",
    href: "https://game.batpepe.online",
    body: "A small browser game shipped exactly like everything else here: SHA-tagged image, Trivy-scanned, ArgoCD-deployed.",
    tags: "docker · gitops"
  },
  {
    title: "the repository",
    href: "https://github.com/batpepe/devops-homelab-k3s-hybrid-cloud",
    body: "Production-style README with architecture diagram, decision records (ADR), operational runbooks and 250+ conventional commits in the open.",
    tags: "readme · adr · runbooks"
  }
];

export default function Proof() {
  return (
    <section id="live" className="scroll-mt-8 border-b border-surface0">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <SectionHeader
          tag="live"
          title="Not a diagram - it runs"
          intro="Live workloads from the same cluster that serves this page."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ITEMS.map((item) => (
            <a
              key={item.title}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-lg border border-surface0 bg-mantle p-5 hover:border-green transition-colors"
            >
              <h3 className="font-mono text-sm text-green group-hover:text-teal transition-colors">
                {item.title} <span aria-hidden="true">-&gt;</span>
              </h3>
              <p className="mt-2 text-sm text-sub">{item.body}</p>
              <p className="mt-4 font-mono text-xs text-overlay">{item.tags}</p>
            </a>
          ))}
        </div>
        <p className="mt-6 font-mono text-xs text-sub">
          <span className="text-overlay">certs:</span> AWS Knowledge badges - Compute · Amazon ECS · AWS Graviton
          <span className="text-overlay"> (2026)</span>
        </p>
      </div>
    </section>
  );
}
