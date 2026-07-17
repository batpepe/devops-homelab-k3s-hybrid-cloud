import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNote, getNotes } from "@/lib/content";

export function generateStaticParams() {
  return getNotes().map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = await getNote(slug);
  if (!note) return {};
  return {
    title: note.meta.title,
    description: note.meta.summary,
    openGraph: { images: ["/og/notes.png"] }
  };
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await getNote(slug);
  if (!note) notFound();

  const { meta, html } = note;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-sm">
        <Link href="/notes" className="text-faint hover:text-cyan transition-colors">
          &lt;- all notes
        </Link>
      </p>
      <p className="mt-6 font-mono text-xs text-faint">{meta.date}</p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-balance">{meta.title}</h1>
      <p className="mt-4 font-mono text-xs text-cyan">{meta.tags.map((t) => `#${t}`).join(" ")}</p>
      <article className="prose-aurora mt-10" dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
