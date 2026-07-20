import { NextResponse } from "next/server";
import { streamScout } from "@/lib/agent/scout";
import { evaluateScoutMessage, POLICY_REFUSAL } from "@/lib/agent/policy";
import { getDb, getSessionByToken } from "@/lib/db";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json() as { message?: string };
  if (!body.message?.trim()) return NextResponse.json({ error: "Message is required" }, { status: 400 });
  try {
    const message = body.message.trim();
    const session = getSessionByToken(token);
    if (!session || session.status !== "active") throw new Error("SESSION_NOT_ACTIVE");
    if (!session.agent_enabled) throw new Error("AGENT_DISABLED");

    const decision = evaluateScoutMessage(message);
    if (!decision.allowed) {
      const db = getDb();
      const createdAt = new Date().toISOString();
      db.prepare("INSERT INTO agent_messages (session_id, role, content, created_at) VALUES (?, 'candidate', ?, ?)").run(session.id, message, createdAt);
      db.prepare("INSERT INTO agent_messages (session_id, role, content, created_at) VALUES (?, 'guardrail', ?, ?)").run(session.id, `Request blocked by deterministic policy: ${decision.category.replace("_", " ")}.`, createdAt);
      return new Response(POLICY_REFUSAL, { headers: { "content-type": "text/plain; charset=utf-8" } });
    }

    const result = streamScout(token, message);
    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scout unavailable";
    return NextResponse.json({ error: message }, { status: message === "AGENT_DISABLED" ? 403 : 400 });
  }
}
