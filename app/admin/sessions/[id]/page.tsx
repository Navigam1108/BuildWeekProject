"use client"

import Link from "next/link"
import { use, useCallback, useEffect, useState } from "react"

type Mission = { id: string; name: string; concepts: string[]; weight: number; score: number | null; status: "measured" | "not_measured"; candidate_ms: number | null; golden_ms: number | null }
type Report = { verdict: string; bench: { candidate_ms: number; baseline_ms: number; improvement_pct: number }; tests: { visible_passed: number; hidden_passed: number }; scorecard?: { missions: Mission[]; percentage: number; golden_pct: number; concepts: string[] } }
type SessionData = { session: { candidate_name: string; title: string; status: string; token: string; created_at: string; ended_at: string | null; variant_seed: number | null; variant_json: string | null }; messages: Array<{ id: number; role: string; content: string }>; report: { report: Report | null } | null; pulse: { candidate_questions: number; scout_answers: number; blocked_requests: number; submissions: number } }

function elapsedLabel(startedAt: string, now: number, endedAt: string | null) {
  const total = Math.max(0, Math.floor(((endedAt ? new Date(endedAt).getTime() : now) - new Date(startedAt).getTime()) / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<SessionData | null>(null)
  const [error, setError] = useState("")
  const [now, setNow] = useState(Date.now())
  const load = useCallback(async () => {
    const response = await fetch(`/api/sessions/${id}`, { cache: "no-store" })
    if (response.ok) setData(await response.json())
    else setError("Unable to load session")
  }, [id])

  useEffect(() => {
    void load()
    const refresh = setInterval(() => void load(), 3000)
    const clock = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      clearInterval(refresh)
      clearInterval(clock)
    }
  }, [load])

  async function end() {
    if (!confirm("End this interview session?")) return
    await fetch(`/api/sessions/${id}/end`, { method: "POST" })
    await load()
  }

  if (error) return <main className="shell"><div className="notice error">{error}</div></main>
  if (!data) return <main className="shell"><div className="muted">Loading session...</div></main>

  const { session, messages, report, pulse } = data
  const grade = report?.report
  const needsCalibration = grade?.scorecard?.missions.some((mission) => mission.status === "not_measured")
  const elapsed = elapsedLabel(session.created_at, now, session.ended_at)

  return <main className="shell">
    <section className="card" style={{ marginBottom: 16 }}><div className="split"><div><div className="eyebrow">Interview elapsed time</div><h2>{elapsed}</h2></div><p className="muted">Timing is informational only. This session remains active until you end it.</p></div></section>
    <div className="topbar"><div><div className="brand">Scout<span>.</span></div><div className="muted">{session.candidate_name} · {session.title}</div></div><Link href="/admin" className="button">Back</Link></div>
    <div className="grid two">
      <section className="card">
        <div className="split"><div><div className="eyebrow">Session control</div><h2>AI interview guide</h2></div><span className="pill coming-soon">Coming soon</span></div>
        <p className="muted">The guided interviewer assistant is being prepared for a future release. This demo keeps the session focused on repository work, tests, benchmarks, and the scorecard.</p>
        <div className="actions">{session.status === "active" && <button className="button danger" onClick={() => void end()}>End session</button>}<Link className="button primary" href={`/s/${session.token}`} target="_blank">Open candidate view</Link></div>
        <div className="notice" style={{ marginTop: 18 }}>Candidate URL: <code>/s/{session.token}</code><br />Replay seed: <code>{session.variant_seed ?? "pending"}</code>{session.variant_json && <><br />Replay profile: <code>{JSON.parse(session.variant_json).label}</code></>}</div>
      </section>
      <section className="card"><div className="eyebrow">Latest grade</div>{grade ? <><h2 className={grade.verdict === "pass" || grade.verdict === "strong" ? "" : "muted"}>{grade.verdict.toUpperCase()}</h2><p className="muted">Bench: {grade.bench.candidate_ms}ms vs {grade.bench.baseline_ms}ms baseline · {grade.bench.improvement_pct}% improvement</p><p className="muted">Tests: {grade.tests.visible_passed} visible, {grade.tests.hidden_passed} hidden passed</p>{grade.scorecard && <div className="scorecard"><h3>Mission scorecard</h3><div className="scorecard-grid">{grade.scorecard.missions.map((mission) => <div key={mission.id} className={`mission-card ${mission.status}`}><div className="mission-name">{mission.name}</div><div className="mission-score">{mission.score === null ? "Awaiting calibration" : `${mission.score}/${mission.weight}`}</div><div className="mission-concepts">{mission.concepts.join(", ")}</div>{mission.status === "measured" && <div className="mission-metric">{mission.candidate_ms}ms candidate · {mission.golden_ms}ms golden</div>}</div>)}</div><p className="muted">{needsCalibration ? "Mission-level scoring appears as each pack is calibrated; the overall benchmark remains available now." : `Score: ${grade.scorecard.percentage}% · Golden target: ${grade.scorecard.golden_pct}%`} · Concepts: {grade.scorecard.concepts.join(", ")}</p></div>}</> : <p className="muted">No submission yet.</p>}</section>
    </div>
    <section className="card" style={{ marginTop: 16 }}><div className="eyebrow">Interview evidence</div><h2>Session pulse</h2><div className="pulse-grid"><div><strong>{pulse.candidate_questions}</strong><span>AI guide questions</span></div><div><strong>{pulse.scout_answers}</strong><span>Guide responses</span></div><div><strong>{pulse.blocked_requests}</strong><span>Policy blocks</span></div><div><strong>{pulse.submissions}</strong><span>Grade runs</span></div></div></section>
    <section className="card" style={{ marginTop: 16 }}><div className="split"><div><h2>Session log</h2><p className="muted">AI guide activity will appear here when the feature launches.</p></div><span className="muted">refreshes every 3s</span></div>{messages.length > 0 ? <div className="chat">{messages.map((message) => <div key={message.id} className={`message ${message.role}`}><div className="message-role">{message.role}</div><div>{message.content}</div></div>)}</div> : <div className="notice">No guide activity in this session.</div>}</section>
  </main>
}
