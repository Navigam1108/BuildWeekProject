import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSession } from "@/lib/db";
import { endSession } from "@/lib/sessions";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  const session = getSession(id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await endSession(session);
  return NextResponse.json({ ok: true });
}
