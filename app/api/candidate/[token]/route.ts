import { NextResponse } from "next/server";
import { publicHostname } from "@/lib/config";
import { getSessionState, sweepExpiredSessions } from "@/lib/sessions";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await sweepExpiredSessions();
  const state = await getSessionState(token);
  if (!state) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  return NextResponse.json({ id: state.id, title: state.title, task_md: state.task_md, status: state.status, agent_enabled: Boolean(state.agent_enabled), ide_url: state.ide_port ? `http://${publicHostname()}:${state.ide_port}` : null, ide_password: state.ide_password });
}
