import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminCookieName, checkAdminPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json() as { password?: string };
  if (!body.password || !checkAdminPassword(body.password)) return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  (await cookies()).set(adminCookieName(), "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  return NextResponse.json({ ok: true });
}
