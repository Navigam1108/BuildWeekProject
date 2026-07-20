import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import yaml from "js-yaml"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function parseReport(output) {
  const line = output.split(/\r?\n/).find((item) => item.startsWith("REPORT_JSON:"))
  if (!line) return null
  try { return JSON.parse(line.slice("REPORT_JSON:".length)) } catch { return null }
}

function getChallenge(slug) {
  const raw = fs.readFileSync(path.join(root, "challenges", slug, "challenge.yaml"), "utf8")
  return yaml.load(raw)
}

function computeScorecard(challengeSlug, report) {
  const challenge = getChallenge(challengeSlug)
  const missions = challenge?.grading?.missions || []
  const goldenPct = challenge?.grading?.golden_target_pct || 50
  const improvement = report?.bench?.improvement_pct || 0
  const slaMet = report?.bench?.sla_met !== false
  const hiddenPassed = report?.tests?.hidden_passed || 0
  const hiddenFailed = report?.tests?.hidden_failed || 0
  const testsOk = hiddenFailed === 0
  let total = 0
  let max = 0
  const allConcepts = new Set()
  const results = missions.map((mission) => {
    for (const c of mission.concepts) allConcepts.add(c)
    const weight = mission.weight || 20
    max += weight
    let score = 0
    if (testsOk) score += weight * 0.35
    if (improvement > 0) score += weight * 0.35 * Math.min(1, improvement / 100)
    if (slaMet) score += weight * 0.20
    if (hiddenPassed > 0) score += weight * 0.10 * (hiddenPassed / (hiddenPassed + hiddenFailed || 1))
    total += score
    return { id: mission.id, name: mission.name, concepts: mission.concepts, weight, score: Math.round(score), benchmark: mission.benchmark }
  })
  if (missions.length === 0) {
    max = 100
    if (testsOk) total += 55
    total += improvement
    if (slaMet) total += 20
    results.push({ id: "primary", name: "Primary benchmark", concepts: [], weight: 100, score: Math.round(total), benchmark: "Overall" })
  }
  return { missions: results, total: Math.round(total), max, percentage: Math.round((total / max) * 100), golden_pct: goldenPct, concepts: [...allConcepts] }
}

const BASE_REPORT = {
  tests: { visible_passed: 0, visible_failed: 0, hidden_passed: 0, hidden_failed: 0 },
  bench: { candidate_ms: 100, baseline_ms: 5000, target_ms: 200, improvement_pct: 98, sla_met: true },
  diff: { files_changed: 2, insertions: 20, deletions: 5 },
  verdict: "pass"
}

const PERFECT_REPORT = {
  tests: { visible_passed: 0, visible_failed: 0, hidden_passed: 5, hidden_failed: 0 },
  bench: { candidate_ms: 1, baseline_ms: 5000, target_ms: 200, improvement_pct: 100, sla_met: true },
  diff: { files_changed: 2, insertions: 20, deletions: 5 },
  verdict: "pass"
}

let passed = 0
let failed = 0
function runTest(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`) } catch (e) { failed++; console.error(`  FAIL ${name}: ${e.message}`) }
}

runTest("parseReport extracts JSON from stdout", () => {
  const parsed = parseReport('REPORT_JSON:{"verdict":"pass"}\nsome debug output\n')
  assert.equal(parsed.verdict, "pass")
})

runTest("parseReport returns null for missing", () => {
  assert.equal(parseReport("no json here"), null)
})

runTest("parseReport returns null for malformed JSON", () => {
  assert.equal(parseReport("REPORT_JSON:{bad"), null)
})

runTest("scorecard full score", () => {
  const card = computeScorecard("orderbook-py", PERFECT_REPORT)
  assert.equal(card.total, card.max)
  assert.equal(card.percentage, 100)
  assert.ok(card.missions.length > 0)
  assert.ok(card.concepts.length > 0)
})

runTest("scorecard partial improvement", () => {
  const report = JSON.parse(JSON.stringify(BASE_REPORT))
  report.bench.improvement_pct = 40
  const card = computeScorecard("orderbook-py", report)
  assert.ok(card.percentage < 100)
  assert.ok(card.percentage > 0)
})

runTest("scorecard no improvement", () => {
  const report = JSON.parse(JSON.stringify(BASE_REPORT))
  report.bench.improvement_pct = 0
  report.bench.sla_met = false
  report.tests.hidden_failed = 5
  const card = computeScorecard("orderbook-py", report)
  assert.ok(card.percentage < 30)
})

runTest("scorecard backward compat with existing packs", () => {
  const report = JSON.parse(JSON.stringify(BASE_REPORT))
  report.tests.hidden_passed = 4
  const card = computeScorecard("payfix-py", report)
  assert.ok(card.missions.length > 0)
})

runTest("scorecard new packs have 5 missions", () => {
  for (const slug of ["orderbook-py", "dispatch-scheduler-ts", "recofeed-py", "route-mesh-ts", "inventory-search-py"]) {
    const card = computeScorecard(slug, PERFECT_REPORT)
    assert.equal(card.missions.length, 5, `${slug} should have 5 missions`)
    assert.equal(card.percentage, 100, `${slug} should be 100%`)
  }
})

console.log(`\nResults: ${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
