import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { challengeRoot } from "./challenges";
import { getDb, getSession, getLatestRun, type SessionRow } from "./db";

function run(command: string, args: string[], options: { cwd?: string; timeout?: number } = {}) {
  try {
    return { output: execFileSync(command, args, { cwd: options.cwd, timeout: options.timeout || 300_000, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), code: 0 };
  } catch (error) {
    const e = error as { stdout?: Buffer | string; stderr?: Buffer | string; status?: number };
    return { output: `${e.stdout?.toString() || ""}\n${e.stderr?.toString() || ""}`, code: e.status || 1 };
  }
}

function parseReport(output: string) {
  const line = output.split(/\r?\n/).find((item) => item.startsWith("REPORT_JSON:"));
  if (!line) return null;
  try { return JSON.parse(line.slice("REPORT_JSON:".length)); } catch { return null; }
}

export async function gradeSession(session: SessionRow) {
  if (!session.container_id) throw new Error("SESSION_CONTAINER_NOT_FOUND");
  const graderDir = path.join(challengeRoot(session.challenge_slug), "grader");
  const copy = run("docker", ["cp", graderDir, `${session.container_id}:/grader`], { timeout: 60_000 });
  let result = copy;
  if (copy.code === 0) result = run("docker", ["exec", session.container_id, "bash", "/grader/grade.sh", "/workspace"], { timeout: 300_000 });
  run("docker", ["exec", session.container_id, "rm", "-rf", "/grader"], { timeout: 30_000 });
  const report = parseReport(result.output);
  getDb().prepare("INSERT INTO runs (session_id, kind, report_json, raw_output, created_at) VALUES (?, 'submit', ?, ?, ?)").run(session.id, report ? JSON.stringify(report) : null, result.output, new Date().toISOString());
  return { report, rawOutput: result.output, ok: Boolean(report) && result.code === 0 };
}

export function latestReport(sessionId: string) {
  const run = getLatestRun(sessionId);
  return run ? { ...run, report: run.report_json ? JSON.parse(run.report_json) : null } : null;
}
