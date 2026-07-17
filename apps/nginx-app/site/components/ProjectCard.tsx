import Link from "next/link";
import type { ProjectMeta } from "@/lib/content";

export default function ProjectCard({ project }: { project: ProjectMeta }) {
  return (
    <Link href={`/projects/${project.slug}`} className="block h-full">
      <article className="glass glow-card flex h-full flex-col p-6">
        <h3 className="text-lg font-semibold text-ink">{project.name}</h3>
        <p className="mt-2 flex-1 text-sm text-sub">{project.tagline}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.stack.slice(0, 4).map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
          {project.stack.length > 4 ? (
            <span className="chip">+{project.stack.length - 4}</span>
          ) : null}
        </div>
        <p className="mt-4 font-mono text-xs text-cyan">read the case study -&gt;</p>
      </article>
    </Link>
  );
}
