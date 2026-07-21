import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { challengeRoot, getChallenge } from "./challenges";
import { getDb, getLatestRun, type SessionRow } from "./db";

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

export type MissionResult = {
  id: string
  name: string
  concepts: string[]
  weight: number
  score: number | null
  benchmark: string
  baseline_ms: number | null
  candidate_ms: number | null
  golden_ms: number | null
  status: "measured" | "not_measured"
}

export type Scorecard = {
  missions: MissionResult[]
  total: number
  max: number
  percentage: number
  golden_pct: number
  concepts: string[]
}

function computeScorecard(challengeSlug: string, report: Record<string, any>): Scorecard {
  const challenge = getChallenge(challengeSlug)
  const missions = challenge?.grading?.missions || []
  const goldenPct = challenge?.grading?.golden_target_pct || 50
  const improvement = report?.bench?.improvement_pct || 0
  const slaMet = report?.bench?.sla_met !== false
  const hiddenPassed = report?.tests?.hidden_passed || 0
  const hiddenFailed = report?.tests?.hidden_failed || 0
  const visibleOk = (report?.tests?.visible_failed || 0) === 0
  const rawMissions = (Array.isArray(report?.missions) ? report.missions : []) as Array<{ id: string; baseline_ms?: number; candidate_ms?: number; golden_ms?: number; passed?: boolean }>
  const evidence = new Map<string, { baseline_ms?: number; candidate_ms?: number; golden_ms?: number; passed?: boolean }>(
    rawMissions.map((mission) => [mission.id, mission])
  )

  let total = 0
  let max = 0
  const allConcepts = new Set<string>()

  const results: MissionResult[] = missions.map((mission) => {
    for (const c of mission.concepts) allConcepts.add(c)
    const weight = mission.weight || 20
    max += weight

    const metric = evidence.get(mission.id)
    if (!metric || typeof metric.baseline_ms !== "number" || typeof metric.candidate_ms !== "number" || typeof metric.golden_ms !== "number") {
      return { id: mission.id, name: mission.name, concepts: mission.concepts, weight, score: null, benchmark: mission.benchmark, baseline_ms: null, candidate_ms: null, golden_ms: null, status: "not_measured" }
    }
    const span = Math.max(1, metric.baseline_ms - metric.golden_ms)
    const progress = Math.max(0, Math.min(1, (metric.baseline_ms - metric.candidate_ms) / span))
    const correctness = metric.passed !== false && visibleOk ? 1 : 0
    const score = weight * (0.35 * correctness + 0.35 * progress + 0.20 * Math.min(1, metric.golden_ms / Math.max(1, metric.candidate_ms)) + 0.10 * (hiddenPassed / (hiddenPassed + hiddenFailed || 1)))
    total += score
    return { id: mission.id, name: mission.name, concepts: mission.concepts, weight, score: Math.round(score), benchmark: mission.benchmark, baseline_ms: metric.baseline_ms, candidate_ms: metric.candidate_ms, golden_ms: metric.golden_ms, status: "measured" }
  })

  if (missions.length === 0) {
    max = 100
    if (visibleOk) total += 55
    total += improvement
    if (slaMet) total += 20
    results.push({ id: "primary", name: "Primary benchmark", concepts: [], weight: 100, score: Math.round(total), benchmark: "Overall", baseline_ms: report?.bench?.baseline_ms || null, candidate_ms: report?.bench?.candidate_ms || null, golden_ms: null, status: "measured" })
  }

  const measured = results.filter((mission) => mission.status === "measured")
  const measuredMax = measured.reduce((sum, mission) => sum + mission.weight, 0)
  return { missions: results, total: Math.round(total), max: measuredMax || max, percentage: measuredMax ? Math.round((total / measuredMax) * 100) : 0, golden_pct: goldenPct, concepts: [...allConcepts] }
}

export async function gradeSession(session: SessionRow) {
  if (!session.container_id) throw new Error("SESSION_CONTAINER_NOT_FOUND");
  const graderDir = path.join(challengeRoot(session.challenge_slug), "grader");
  const copy = run("docker", ["cp", graderDir, `${session.container_id}:/grader`], { timeout: 60_000 });
  let result = copy;
  if (copy.code === 0) result = run("docker", ["exec", session.container_id, "bash", "/grader/grade.sh", "/workspace"], { timeout: 300_000 });
  run("docker", ["exec", session.container_id, "rm", "-rf", "/grader"], { timeout: 30_000 });
  const report = parseReport(result.output);
  const scorecard = report ? computeScorecard(session.challenge_slug, report) : null;
  const enriched = report ? { ...report, scorecard } : null;
  getDb().prepare("INSERT INTO runs (session_id, kind, report_json, raw_output, created_at) VALUES (?, 'submit', ?, ?, ?)").run(session.id, enriched ? JSON.stringify(enriched) : null, result.output, new Date().toISOString());
  return { report: enriched, rawOutput: result.output, ok: Boolean(report) && result.code === 0 };
}

export function latestReport(sessionId: string) {
  const run = getLatestRun(sessionId);
  return run ? { ...run, report: run.report_json ? JSON.parse(run.report_json) : null } : null;
}
