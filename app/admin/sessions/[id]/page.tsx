"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

type Mission = { id: string; name: string; concepts: string[]; weight: number; score: number | null; status: "measured" | "not_measured"; candidate_ms: number | null; golden_ms: number | null };
type Report = { verdict: string; bench: { candidate_ms: number; baseline_ms: number; improvement_pct: number }; tests: { visible_passed: number; hidden_passed: number }; scorecard?: { missions: Mission[]; percentage: number; golden_pct: number; concepts: string[] } };
type SessionData = { session: { candidate_name: string; title: string; status: string; agent_enabled: boolean; token: string }; messages: Array<{ id: number; role: string; content: string }>; report: { report: Report | null } | null; pulse: { candidate_questions: number; scout_answers: number; blocked_requests: number; submissions: number } };

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<SessionData | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const response = await fetch(`/api/sessions/${id}`, { cache: "no-store" });
    if (response.ok) setData(await response.json()); else setError("Unable to load session");
  }, [id]);
  useEffect(() => { void load(); const timer = setInterval(() => void load(), 3000); return () => clearInterval(timer); }, [load]);
  async function toggle() { await fetch(`/api/sessions/${id}/toggle-agent`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ enabled: !data?.session.agent_enabled }) }); await load(); }
  async function end() { if (confirm("End this interview session?")) { await fetch(`/api/sessions/${id}/end`, { method: "POST" }); await load(); } }

  if (error) return <main className="shell"><div className="notice error">{error}</div></main>;
  if (!data) return <main className="shell"><div className="muted">Loading session…</div></main>;
  const { session, messages, report, pulse } = data;
  const grade = report?.report;
  const needsCalibration = grade?.scorecard?.missions.some((mission) => mission.status === "not_measured");

  return <main className="shell">
    <div className="topbar"><div><div className="brand">Scout<span>.</span></div><div className="muted">{session.candidate_name} · {session.title}</div></div><Link href="/admin" className="button">Back</Link></div>
    <div className="grid two">
      <section className="card"><div className="split"><div><div className="eyebrow">Live control</div><h2>Scout is {session.agent_enabled ? "available" : "disabled"}</h2></div><span className={`pill ${session.agent_enabled ? "live" : "off"}`}>{session.status}</span></div><div className="actions"><button className="button primary" onClick={toggle}>{session.agent_enabled ? "Disable Scout" : "Enable Scout"}</button>{session.status === "active" && <button className="button danger" onClick={end}>End session</button>}<Link className="button" href={`/s/${session.token}`} target="_blank">Open candidate view</Link></div><div className="notice" style={{ marginTop: 18 }}>Candidate URL: <code>/s/{session.token}</code></div></section>
      <section className="card"><div className="eyebrow">Latest grade</div>{grade ? <><h2 className={grade.verdict === "pass" || grade.verdict === "strong" ? "" : "muted"}>{grade.verdict.toUpperCase()}</h2><p className="muted">Bench: {grade.bench.candidate_ms}ms vs {grade.bench.baseline_ms}ms baseline · {grade.bench.improvement_pct}% improvement</p><p className="muted">Tests: {grade.tests.visible_passed} visible, {grade.tests.hidden_passed} hidden passed</p>{grade.scorecard && <div className="scorecard"><h3>Mission scorecard</h3><div className="scorecard-grid">{grade.scorecard.missions.map((mission) => <div key={mission.id} className={`mission-card ${mission.status}`}><div className="mission-name">{mission.name}</div><div className="mission-score">{mission.score === null ? "Awaiting calibration" : `${mission.score}/${mission.weight}`}</div><div className="mission-concepts">{mission.concepts.join(", ")}</div>{mission.status === "measured" && <div className="mission-metric">{mission.candidate_ms}ms candidate · {mission.golden_ms}ms golden</div>}</div>)}</div><p className="muted">{needsCalibration ? "Mission-level scoring appears as each pack is calibrated; the overall benchmark remains available now." : `Score: ${grade.scorecard.percentage}% · Golden target: ${grade.scorecard.golden_pct}%`} · Concepts: {grade.scorecard.concepts.join(", ")}</p></div>}</> : <p className="muted">No submission yet.</p>}</section>
    </div>
    <section className="card" style={{ marginTop: 16 }}><div className="eyebrow">Interview evidence</div><h2>Session pulse</h2><div className="pulse-grid"><div><strong>{pulse.candidate_questions}</strong><span>Scout questions</span></div><div><strong>{pulse.scout_answers}</strong><span>Grounded answers</span></div><div><strong>{pulse.blocked_requests}</strong><span>Policy blocks</span></div><div><strong>{pulse.submissions}</strong><span>Grade runs</span></div></div></section>
    <section className="card" style={{ marginTop: 16 }}><div className="split"><h2>Live transcript</h2><span className="muted">refreshes every 3s</span></div><div className="chat">{messages.map((message) => <div key={message.id} className={`message ${message.role}`}><div className="message-role">{message.role}</div><div>{message.content}</div></div>)}</div></section>
  </main>;
}
