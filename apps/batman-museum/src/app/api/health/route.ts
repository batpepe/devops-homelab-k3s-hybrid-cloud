import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Liveness/readiness: process-up check only, no DB dependency so a cold or
// unseeded database never flaps the pod.
export function GET() {
  return NextResponse.json({ status: "ok" });
}
