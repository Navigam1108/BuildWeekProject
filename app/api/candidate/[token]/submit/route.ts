import { NextResponse } from "next/server";
import { getSessionByToken } from "@/lib/db";
import { gradeSession } from "@/lib/grader";

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = getSessionByToken(token);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.status !== "active") return NextResponse.json({ error: "Session is not active" }, { status: 409 });
  try {
    const result = await gradeSession(session);
    return NextResponse.json({ ok: result.ok, visible: result.report?.tests ? { visible_passed: result.report.tests.visible_passed, visible_failed: result.report.tests.visible_failed } : null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Grading failed" }, { status: 500 });
  }
}
