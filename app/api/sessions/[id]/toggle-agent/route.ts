import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDb, getSession } from "@/lib/db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  const session = getSession(id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const requested = (await request.json().catch(() => ({}))) as { enabled?: boolean };
  const enabled = typeof requested.enabled === "boolean" ? requested.enabled : !Boolean(session.agent_enabled);
  const db = getDb();
  db.prepare("UPDATE sessions SET agent_enabled = ? WHERE id = ?").run(enabled ? 1 : 0, id);
  db.prepare("INSERT INTO agent_messages (session_id, role, content, created_at) VALUES (?, 'system', ?, ?)").run(id, enabled ? "Agent enabled by interviewer" : "Agent disabled by interviewer", new Date().toISOString());
  return NextResponse.json({ agent_enabled: enabled });
}
