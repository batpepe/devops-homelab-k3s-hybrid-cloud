import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "How the Batman Museum works: Next.js 15 with React Three Fiber, real Wikipedia-sourced exhibits in PostgreSQL, deployed the GitOps way on a self-hosted K3s cluster."
};

const STACK = [
  { name: "Next.js 15 + React 19", role: "App Router, server components, standalone image" },
  { name: "React Three Fiber + drei", role: "the walkable 3D galleries, reflections, volumetric light" },
  { name: "d3-zoom + GSAP", role: "the infinite star-map timeline and its transitions" },
  { name: "PostgreSQL 15", role: "7 eras and 49 exhibits, seeded idempotently from curated data" },
  { name: "K3s + ArgoCD + GitHub Actions", role: "GitOps deploys with Trivy-gated, SHA-pinned images" }
];

export default function AboutPage() {
  return (
    <main className="h-dvh w-screen overflow-y-auto bg-[var(--bg)]">
      <div className="mx-auto max-w-2xl px-6 py-14">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--cyan)]">
          batcomputer // dossier
        </p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-[0.12em] text-[var(--text)]">
          ABOUT THE MUSEUM
        </h1>

        <div className="mt-8 space-y-4 text-[14px] leading-relaxed text-[var(--text)]">
          <p>
            The Bat-Archive is a walkable museum of Batman history, 1939 to today. The star map
            on the landing page charts 30 milestones as constellations; each era opens into a
            first-person Batcave wing holding its exhibits - 49 in total across seven eras.
          </p>
          <p>
            Everything on display is real. Exhibit text and artwork come from Wikipedia through a
            scripted pipeline: a fetch script pulls lead images and article extracts, a curation
            file adds hand-written impact lines and fun facts, and an idempotent seeder upserts
            the merged result into PostgreSQL. Nothing is generated or hallucinated.
          </p>
          <p>
            The museum is also a workload: it runs on a self-hosted K3s cluster behind an
            outbound-only Cloudflare tunnel, deployed by ArgoCD from a public GitOps repository,
            with a Trivy gate in front of every image.
          </p>
        </div>

        <h2 className="font-display mt-10 text-[13px] uppercase tracking-[0.3em] text-[var(--cyan)]">
          Under the cowl
        </h2>
        <ul className="mt-4 space-y-2">
          {STACK.map((s) => (
            <li key={s.name} className="border border-[var(--line)] bg-[var(--panel)] px-4 py-3">
              <p className="font-display text-[13px] font-semibold tracking-[0.08em] text-[var(--text)]">
                {s.name}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-[var(--dim)]">{s.role}</p>
            </li>
          ))}
        </ul>

        <h2 className="font-display mt-10 text-[13px] uppercase tracking-[0.3em] text-[var(--cyan)]">
          Attribution
        </h2>
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--dim)]">
          Exhibit descriptions are adapted from Wikipedia articles (CC BY-SA); every exhibit card
          links to its source article. Artwork is served from Wikimedia through a same-origin
          proxy with a strict allowlist. Batman and related characters are trademarks of DC.
          This is a non-commercial fan and engineering project.
        </p>

        <div className="mt-10 flex flex-wrap gap-2 pb-10">
          <Link
            href="/"
            className="font-display border border-[var(--line)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--cyan)] transition-colors hover:border-[var(--cyan)]"
          >
            &lt;&lt; star map
          </Link>
          <a
            href="https://github.com/batpepe/devops-homelab-k3s-hybrid-cloud/tree/main/apps/batman-museum"
            target="_blank"
            rel="noopener noreferrer"
            className="font-display border border-[var(--line)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--dim)] transition-colors hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
          >
            source code
          </a>
          <a
            href="https://cv.batpepe.online"
            target="_blank"
            rel="noopener noreferrer"
            className="font-display border border-[var(--line)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--dim)] transition-colors hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
          >
            the engineer
          </a>
        </div>
      </div>
    </main>
  );
}
