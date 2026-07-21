import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const rows = getDb().prepare("SELECT slug, title, language, level, task_md, config_json FROM challenges ORDER BY title").all() as Array<{ slug: string; title: string; language: string; level: string; task_md: string; config_json: string }>;
  return NextResponse.json(rows.map((row) => {
    const config = JSON.parse(row.config_json) as { domain?: string; summary?: string; dsa_topics?: string[]; interview_design?: { repo_shape?: string; intentional_todos?: number }; grading?: { missions?: unknown[] } };
    return {
      ...row,
      domain: config.domain || "engineering",
      summary: config.summary || "Repository performance interview.",
      dsa_topics: config.dsa_topics || [],
      repo_shape: config.interview_design?.repo_shape || "service",
      intentional_todos: config.interview_design?.intentional_todos || 0,
      mission_count: config.grading?.missions?.length || 0,
    };
  }));
}
