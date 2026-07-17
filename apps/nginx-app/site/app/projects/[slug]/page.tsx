import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getProjects } from "@/lib/content";

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};
  return {
    title: project.meta.name,
    description: project.meta.tagline,
    openGraph: { images: ["/og/projects.png"] }
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const { meta, html } = project;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-sm">
        <Link href="/projects" className="text-faint hover:text-cyan transition-colors">
          &lt;- all projects
        </Link>
      </p>
      <h1 className="mt-6 text-3xl sm:text-4xl font-bold tracking-tight">{meta.name}</h1>
      <p className="mt-3 text-lg text-sub">{meta.tagline}</p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {meta.stack.map((s) => (
          <span key={s} className="chip">
            {s}
          </span>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3 font-mono text-sm">
        {meta.live ? (
          <a
            href={meta.live}
            target="_blank"
            rel="noopener noreferrer"
            className="glow-card rounded-md border border-line px-4 py-2 text-cyan"
          >
            open live -&gt;
          </a>
        ) : null}
        <a
          href={meta.source}
          target="_blank"
          rel="noopener noreferrer"
          className="glow-card rounded-md border border-line px-4 py-2 text-sub"
        >
          source -&gt;
        </a>
      </div>

      <article className="prose-aurora mt-10" dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
