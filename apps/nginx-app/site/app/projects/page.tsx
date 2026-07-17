import type { Metadata } from "next";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";
import { getProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Case studies of the workloads on my K3s homelab: the GitOps platform itself, a 3D museum with a real content pipeline, and a canvas game with a CI smoke suite.",
  openGraph: { images: ["/og/projects.png"] }
};

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <SectionHeader
        tag="projects"
        title="Case studies"
        intro="Each project runs on the platform right now and has its own pipeline. The write-ups cover the problem, the design and what broke along the way."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <Reveal key={p.slug} delay={(i % 3) * 80} className="h-full">
            <ProjectCard project={p} />
          </Reveal>
        ))}
      </div>
    </main>
  );
}
