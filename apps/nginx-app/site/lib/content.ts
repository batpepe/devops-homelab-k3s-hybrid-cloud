import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

// Build-time only: every consumer is a server component prerendered during
// `next build` (output: "export"), so fs access never runs in the browser.

const CONTENT_DIR = path.join(process.cwd(), "content");

export interface NoteMeta {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
}

export interface ProjectMeta {
  slug: string;
  name: string;
  tagline: string;
  stack: string[];
  live?: string;
  source: string;
  order: number;
}

// sanitize: false is safe here: content/ is first-party markdown committed to
// this repo, and it keeps language- classes on fenced code blocks.
async function renderMarkdown(md: string): Promise<string> {
  const out = await remark().use(remarkGfm).use(remarkHtml, { sanitize: false }).process(md);
  return String(out);
}

function readCollection(dir: string) {
  const full = path.join(CONTENT_DIR, dir);
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(full, f), "utf8");
      const { data, content } = matter(raw);
      return { slug: f.replace(/\.md$/, ""), data, content };
    });
}

export function getNotes(): NoteMeta[] {
  return readCollection("notes")
    .map(({ slug, data }) => ({
      slug,
      title: String(data.title),
      date: String(data.date),
      summary: String(data.summary),
      tags: (data.tags ?? []) as string[]
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getNote(slug: string): Promise<{ meta: NoteMeta; html: string } | null> {
  const entry = readCollection("notes").find((n) => n.slug === slug);
  if (!entry) return null;
  return {
    meta: {
      slug,
      title: String(entry.data.title),
      date: String(entry.data.date),
      summary: String(entry.data.summary),
      tags: (entry.data.tags ?? []) as string[]
    },
    html: await renderMarkdown(entry.content)
  };
}

export function getProjects(): ProjectMeta[] {
  return readCollection("projects")
    .map(({ slug, data }) => ({
      slug,
      name: String(data.name),
      tagline: String(data.tagline),
      stack: (data.stack ?? []) as string[],
      live: data.live ? String(data.live) : undefined,
      source: String(data.source),
      order: Number(data.order ?? 99)
    }))
    .sort((a, b) => a.order - b.order);
}

export async function getProject(
  slug: string
): Promise<{ meta: ProjectMeta; html: string } | null> {
  const entry = readCollection("projects").find((p) => p.slug === slug);
  if (!entry) return null;
  return {
    meta: {
      slug,
      name: String(entry.data.name),
      tagline: String(entry.data.tagline),
      stack: (entry.data.stack ?? []) as string[],
      live: entry.data.live ? String(entry.data.live) : undefined,
      source: String(entry.data.source),
      order: Number(entry.data.order ?? 99)
    },
    html: await renderMarkdown(entry.content)
  };
}
