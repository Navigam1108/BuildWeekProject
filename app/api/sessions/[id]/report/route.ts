import { NextResponse } from "next/server";
import { getSession } from "@/lib/db";
import { latestReport } from "@/lib/grader";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getSession(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(latestReport(id));
}
