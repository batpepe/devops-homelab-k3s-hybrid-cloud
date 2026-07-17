import Link from "next/link";
import Hero from "@/components/Hero";
import Highlights from "@/components/Highlights";
import Architecture from "@/components/Architecture";
import Experience from "@/components/Experience";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";
import { getProjects } from "@/lib/content";

export default function Home() {
  const projects = getProjects();

  return (
    <main>
      <Hero />
      <Highlights />
      <Architecture />
      <section id="projects" className="scroll-mt-16 border-t border-line/70">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <SectionHeader
            tag="projects"
            title="Built on this platform"
            intro="Real workloads, each with its own pipeline, each one click away."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 3) * 80} className="h-full">
                <ProjectCard project={p} />
              </Reveal>
            ))}
          </div>
          <p className="mt-8 font-mono text-sm">
            <Link href="/projects" className="text-cyan hover:text-ink transition-colors">
              all case studies -&gt;
            </Link>
          </p>
        </div>
      </section>
      <Experience />
    </main>
  );
}
