import { NextResponse } from "next/server";
import { getSessionState, sweepExpiredSessions } from "@/lib/sessions";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await sweepExpiredSessions();
  const state = await getSessionState(token);
  if (!state) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  return NextResponse.json({ id: state.id, title: state.title, task_md: state.task_md, status: state.status, agent_enabled: Boolean(state.agent_enabled), time_remaining_ms: state.time_remaining_ms, ide_url: state.ide_port ? `http://${process.env.PUBLIC_HOST || "localhost"}:${state.ide_port}` : null, ide_password: state.ide_password });
}
