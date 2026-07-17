import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";
import { STACK } from "@/content/stack";

export const metadata: Metadata = {
  title: "Stack",
  description:
    "Every tool in the homelab platform and the one-line reason it earned its place: Terraform, Ansible, K3s, ArgoCD, GitHub Actions, Trivy, Prometheus, Loki and more.",
  openGraph: { images: ["/og/stack.png"] }
};

export default function StackPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <SectionHeader
        tag="stack"
        title="Tools and why they earned their place"
        intro="Nothing here is aspirational - every tool below runs in the platform today, and each one had to justify itself."
      />
      <div className="space-y-10">
        {STACK.map((group, gi) => (
          <Reveal key={group.title} delay={gi * 40}>
            <section>
              <h2 className="font-mono text-sm text-cyan">
                [{group.tag}] <span className="ml-2 font-sans text-lg font-semibold text-ink">{group.title}</span>
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {group.tools.map((tool) => (
                  <div key={tool.name} className="glass glow-card p-5">
                    <h3 className="font-semibold text-ink">{tool.name}</h3>
                    <p className="mt-1.5 text-sm text-sub">{tool.why}</p>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>
        ))}
      </div>
    </main>
  );
}
