import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSession, sweepExpiredSessions } from "@/lib/sessions";

export async function GET() {
  await sweepExpiredSessions();
  const rows = getDb().prepare(`SELECT s.*, c.title FROM sessions s JOIN challenges c ON c.slug=s.challenge_slug ORDER BY s.created_at DESC`).all();
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { challenge_slug?: string; candidate_name?: string; variant_seed?: number };
    const result = await createSession({
      challengeSlug: body.challenge_slug || "",
      candidateName: body.candidate_name || "Candidate",
      variantSeed: body.variant_seed,
      candidateOrigin: new URL(request.url).origin,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create session" }, { status: 500 });
  }
}
