import { NextResponse } from "next/server";
import { fetchGallery } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const payload = await fetchGallery(slug);
  if (!payload) return NextResponse.json({ error: "era not found" }, { status: 404 });
  return NextResponse.json(payload);
}
