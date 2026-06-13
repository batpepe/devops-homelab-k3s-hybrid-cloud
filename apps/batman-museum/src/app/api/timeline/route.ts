import { NextResponse } from "next/server";
import { fetchTimeline } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await fetchTimeline());
}
