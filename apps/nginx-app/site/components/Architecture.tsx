import SectionHeader from "@/components/SectionHeader";

const FACTS = [
  "git push is the only deploy action: CI builds, scans and updates the manifest, ArgoCD does the rest.",
  "The cluster heals itself: anything changed out-of-band is reverted to match Git.",
  "The home network exposes nothing: the tunnel dials out, Cloudflare terminates the edge."
];

function Box({ x, y, w, h, title, sub, accent }: { x: number; y: number; w: number; h: number; title: string; sub?: string; accent?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="6" fill="var(--color-bg2)" stroke={accent ?? "var(--color-line)"} />
      <text x={x + w / 2} y={sub ? y + h / 2 - 6 : y + h / 2 + 4} textAnchor="middle" fill="var(--color-ink)" fontSize="13" fontFamily="var(--font-mono)">
        {title}
      </text>
      {sub ? (
        <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" fill="var(--color-sub)" fontSize="10" fontFamily="var(--font-mono)">
          {sub}
        </text>
      ) : null}
    </g>
  );
}

function Arrow({ d, label, lx, ly }: { d: string; label?: string; lx?: number; ly?: number }) {
  return (
    <g>
      <path d={d} fill="none" stroke="var(--color-faint)" strokeWidth="1.5" markerEnd="url(#arrow)" />
      {label ? (
        <text x={lx} y={ly} textAnchor="middle" fill="var(--color-faint)" fontSize="10" fontFamily="var(--font-mono)">
          {label}
        </text>
      ) : null}
    </g>
  );
}

export default function Architecture() {
  return (
    <section id="architecture" className="scroll-mt-16 border-t border-line/70">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <SectionHeader tag="architecture" title="How a change ships" />
        <div className="glass overflow-x-auto p-4">
          <svg viewBox="0 0 860 380" className="min-w-[760px] w-full" role="img" aria-labelledby="arch-title arch-desc">
            <title id="arch-title">Deployment architecture</title>
            <desc id="arch-desc">
              A git push triggers GitHub Actions, which builds and scans an image, pushes it to GHCR and updates the
              Kubernetes manifest. ArgoCD pulls the repository and deploys to the K3s cluster. Visitors reach the apps
              through Cloudflare and an outbound-only tunnel. Terraform and Ansible manage a separate AWS EC2 host.
            </desc>
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="var(--color-faint)" />
              </marker>
              <linearGradient id="zoneline" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="var(--aurora-violet)" />
                <stop offset="0.5" stopColor="var(--aurora-blue)" />
                <stop offset="1" stopColor="var(--aurora-cyan)" />
              </linearGradient>
            </defs>

            {/* zones */}
            <rect x="16" y="16" width="380" height="150" rx="8" fill="none" stroke="var(--color-line)" strokeDasharray="4 4" />
            <text x="28" y="36" fill="var(--color-blue)" fontSize="11" fontFamily="var(--font-mono)">GitHub</text>
            <rect x="16" y="196" width="580" height="164" rx="8" fill="none" stroke="url(#zoneline)" strokeOpacity="0.55" strokeDasharray="4 4" />
            <text x="28" y="216" fill="var(--color-green)" fontSize="11" fontFamily="var(--font-mono)">Homelab · K3s cluster</text>
            <rect x="620" y="196" width="224" height="164" rx="8" fill="none" stroke="var(--color-line)" strokeDasharray="4 4" />
            <text x="632" y="216" fill="var(--color-amber)" fontSize="11" fontFamily="var(--font-mono)">AWS · eu-central-1</text>

            {/* pipeline row */}
            <Box x={36} y={56} w={100} h={44} title="git push" accent="var(--color-green)" />
            <Box x={176} y={56} w={120} h={44} title="Actions CI" sub="build · trivy" />
            <Box x={36} y={112} w={100} h={40} title="manifest" sub="sha bump" />
            <Box x={336} y={56} w={44} h={44} title="GHCR" />
            <Arrow d="M136,78 L172,78" />
            <Arrow d="M300,78 L332,78" />
            <Arrow d="M176,100 C140,132 140,120 140,124" label="commit back" lx={210} ly={124} />

            {/* cluster row */}
            <Box x={36} y={248} w={110} h={44} title="ArgoCD" sub="prune · self-heal" accent="var(--color-blue)" />
            <Box x={196} y={248} w={110} h={44} title="Traefik" sub="per-host routing" />
            <Box x={356} y={236} w={216} h={110} title="workloads" sub="this site · game · museum" />
            <text x={464} y={316} textAnchor="middle" fill="var(--color-sub)" fontSize="10" fontFamily="var(--font-mono)">
              prometheus · grafana · postgres
            </text>
            <Arrow d="M86,152 L86,244" label="argocd pulls main" lx={160} ly={186} />
            <Arrow d="M146,270 L192,270" />
            <Arrow d="M306,270 L352,270" />
            <Arrow d="M358,104 C358,180 440,180 452,232" label="image pull" lx={420} ly={168} />

            {/* edge */}
            <Box x={636} y={56} w={90} h={44} title="visitor" />
            <Box x={756} y={56} w={88} h={44} title="Cloudflare" sub="edge · dns" accent="var(--color-cyan)" />
            <Arrow d="M730,78 L752,78" />
            <Arrow d="M756,100 C660,160 620,220 580,258" label="outbound-only tunnel" lx={700} ly={170} />

            {/* aws */}
            <Box x={648} y={248} w={80} h={44} title="EC2" sub="docker" />
            <Box x={756} y={248} w={72} h={44} title="nginx" />
            <Arrow d="M732,270 L752,270" />
            <text x={688} y={330} fill="var(--color-sub)" fontSize="10" fontFamily="var(--font-mono)">
              terraform apply · ansible
            </text>
          </svg>
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {FACTS.map((fact) => (
            <li key={fact} className="glass p-4 text-sm text-sub">
              {fact}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
