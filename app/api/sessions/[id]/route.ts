import { NextResponse } from "next/server";
import { publicHostname } from "@/lib/config";
import { getDb, getMessages, getSessionPulse, type SessionRow } from "@/lib/db";
import { latestReport } from "@/lib/grader";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getDb().prepare(`SELECT s.*, c.title, c.task_md FROM sessions s JOIN challenges c ON c.slug=s.challenge_slug WHERE s.id=?`).get(id) as (SessionRow & { title: string; task_md: string }) | undefined;
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const ideUrl = session.ide_port ? `http://${publicHostname()}:${session.ide_port}` : null;
  return NextResponse.json({ session: { ...session, ide_url: ideUrl }, messages: getMessages(id), report: latestReport(id), pulse: getSessionPulse(id) });
}
