import { NextResponse } from "next/server";
import { getMessages, getSessionByToken } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = getSessionByToken(token);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  return NextResponse.json(getMessages(session.id));
}
