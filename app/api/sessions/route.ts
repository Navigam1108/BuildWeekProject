import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { createSession, sweepExpiredSessions } from "@/lib/sessions";

export async function GET() {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  await sweepExpiredSessions();
  const rows = getDb().prepare(`SELECT s.*, c.title FROM sessions s JOIN challenges c ON c.slug=s.challenge_slug ORDER BY s.created_at DESC`).all();
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  try {
    const body = await request.json() as { challenge_slug?: string; candidate_name?: string; duration_min?: number };
    const result = await createSession({ challengeSlug: body.challenge_slug || "", candidateName: body.candidate_name || "Candidate", durationMin: body.duration_min });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create session" }, { status: 500 });
  }
}
