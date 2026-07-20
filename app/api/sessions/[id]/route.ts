import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDb, getMessages, getSessionPulse } from "@/lib/db";
import { latestReport } from "@/lib/grader";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  const session = getDb().prepare(`SELECT s.*, c.title, c.task_md FROM sessions s JOIN challenges c ON c.slug=s.challenge_slug WHERE s.id=?`).get(id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ session, messages: getMessages(id), report: latestReport(id), pulse: getSessionPulse(id) });
}
