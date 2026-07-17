import Link from "next/link";
import VisitCounter from "@/components/VisitCounter";

const REPO_URL = "https://github.com/batpepe/devops-homelab-k3s-hybrid-cloud";

export default function Hero() {
  return (
    <header className="relative">
      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <p className="font-mono text-sm text-green mb-5">$ whoami</p>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-balance max-w-3xl">
          I build and run infrastructure <span className="grad-text">the GitOps way.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-sub">
          I&apos;m Kostiantyn Osmakov, a junior DevOps engineer from Kyiv with an IT operations
          background. The page you are reading is served from my own K3s cluster: every deploy
          starts as a git push, gets built and scanned in CI, and lands here through ArgoCD -
          with zero open inbound ports at home.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-gradient-to-r from-[var(--aurora-violet)] via-[var(--aurora-blue)] to-[var(--aurora-cyan)] px-5 py-2.5 font-semibold text-white shadow-lg shadow-blue/20 hover:brightness-110 transition"
          >
            View the source on GitHub
          </a>
          <a
            href="/CV_Kostiantyn_Osmakov.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="glow-card rounded-lg border border-line px-5 py-2.5 font-semibold text-ink"
          >
            Download CV (PDF)
          </a>
          <Link href="/status" className="font-mono text-sm text-cyan hover:text-ink transition-colors">
            see the platform live -&gt;
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          <span className="chip">
            k3s <span className="text-faint">·</span> self-hosted
          </span>
          <span className="chip">
            gitops <span className="text-faint">·</span> argocd
          </span>
          <span className="chip">
            zero open ports <span className="text-faint">·</span> tunnel
          </span>
          <VisitCounter />
        </div>
      </div>
    </header>
  );
}
