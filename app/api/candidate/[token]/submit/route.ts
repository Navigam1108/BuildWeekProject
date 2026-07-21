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
    if (!result.ok || !result.report) {
      return NextResponse.json({
        ok: false,
        error: "Grading could not finish. Run make test and make bench in the workspace, then submit again."
      }, { status: 422 });
    }
    return NextResponse.json({
      ok: true,
      visible: {
        visible_passed: result.report.tests.visible_passed,
        visible_failed: result.report.tests.visible_failed
      },
      verdict: result.report.verdict
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SESSION_CONTAINER_NOT_FOUND") {
      return NextResponse.json({ error: "The interview workspace is unavailable. Ask the interviewer to start a new session." }, { status: 409 });
    }
    return NextResponse.json({ error: "The grading service is temporarily unavailable. Please submit again in a moment." }, { status: 503 });
  }
}
