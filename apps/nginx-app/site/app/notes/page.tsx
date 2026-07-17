import type { Metadata } from "next";
import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";
import { getNotes } from "@/lib/content";

export const metadata: Metadata = {
  title: "Notes",
  description:
    "Engineering notes from running a GitOps homelab: things that broke, decisions that held up, and what they taught me.",
  openGraph: { images: ["/og/notes.png"] }
};

export default function NotesPage() {
  const notes = getNotes();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <SectionHeader
        tag="notes"
        title="Engineering notes"
        intro="Short write-ups from operating this platform. Every story here actually happened in the repo."
      />
      <ul className="space-y-4">
        {notes.map((note) => (
          <li key={note.slug}>
            <Link href={`/notes/${note.slug}`} className="block">
              <article className="glass glow-card p-6">
                <p className="font-mono text-xs text-faint">{note.date}</p>
                <h2 className="mt-2 text-lg font-semibold text-ink">{note.title}</h2>
                <p className="mt-2 text-sm text-sub">{note.summary}</p>
                <p className="mt-3 font-mono text-xs text-cyan">{note.tags.map((t) => `#${t}`).join(" ")}</p>
              </article>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
