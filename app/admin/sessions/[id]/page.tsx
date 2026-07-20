"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => { const response = await fetch(`/api/sessions/${id}`, { cache: "no-store" }); if (response.ok) setData(await response.json()); else setError("Unable to load session"); }, [id]);
  useEffect(() => { void load(); const timer = setInterval(() => void load(), 3000); return () => clearInterval(timer); }, [load]);
  async function toggle() { await fetch(`/api/sessions/${id}/toggle-agent`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ enabled: !data.session.agent_enabled }) }); await load(); }
  async function end() { if (confirm("End this interview session?")) { await fetch(`/api/sessions/${id}/end`, { method: "POST" }); await load(); } }
  if (error) return <main className="shell"><div className="notice error">{error}</div></main>;
  if (!data) return <main className="shell"><div className="muted">Loading session…</div></main>;
  const { session, messages, report, pulse } = data;
  return <main className="shell"><div className="topbar"><div><div className="brand">Scout<span>.</span></div><div className="muted">{session.candidate_name} · {session.title}</div></div><Link href="/admin" className="button">Back</Link></div>
    <div className="grid two"><section className="card"><div className="split"><div><div className="eyebrow">Live control</div><h2>Scout is {session.agent_enabled ? "available" : "disabled"}</h2></div><span className={`pill ${session.agent_enabled ? "live" : "off"}`}>{session.status}</span></div><div className="actions"><button className="button primary" onClick={toggle}>{session.agent_enabled ? "Disable Scout" : "Enable Scout"}</button>{session.status === "active" && <button className="button danger" onClick={end}>End session</button>}{session.token && <Link className="button" href={`/s/${session.token}`} target="_blank">Open candidate view</Link>}</div><div className="notice" style={{ marginTop: 18 }}>Candidate URL: <code>/s/{session.token}</code></div></section>
    <section className="card"><div className="eyebrow">Latest grade</div>{report?.report ? <><h2 className={report.report.verdict === "pass" ? "" : "muted"}>{report.report.verdict.toUpperCase()}</h2><p className="muted">Bench: {report.report.bench.candidate_ms}ms vs {report.report.bench.baseline_ms}ms baseline · {report.report.bench.improvement_pct}% improvement</p><p className="muted">Tests: {report.report.tests.visible_passed} visible, {report.report.tests.hidden_passed} hidden passed</p>{report.report.scorecard && <div className="scorecard"><h3>Mission scorecard</h3><div className="scorecard-grid">{report.report.scorecard.missions.map((mission: any) => <div key={mission.id} className="mission-card"><div className="mission-name">{mission.name}</div><div className="mission-score">{mission.score}/{mission.weight}</div><div className="mission-concepts">{mission.concepts.join(", ")}</div></div>)}</div><p className="muted">Score: {report.report.scorecard.percentage}% · Golden target: {report.report.scorecard.golden_pct}% · Concepts: {report.report.scorecard.concepts.join(", ")}</p></div>}</> : <p className="muted">No submission yet.</p>}</section></div>
    <section className="card" style={{ marginTop: 16 }}><div className="eyebrow">Interview evidence</div><h2>Session pulse</h2><div className="pulse-grid"><div><strong>{pulse.candidate_questions}</strong><span>Scout questions</span></div><div><strong>{pulse.scout_answers}</strong><span>Grounded answers</span></div><div><strong>{pulse.blocked_requests}</strong><span>Policy blocks</span></div><div><strong>{pulse.submissions}</strong><span>Grade runs</span></div></div><p className="muted">Policy blocks are logged without sending the request to the model, so the transcript distinguishes deterministic enforcement from model behavior.</p></section>
    <section className="card" style={{ marginTop: 16 }}><div className="split"><h2>Live transcript</h2><span className="muted">refreshes every 3s</span></div><div className="chat">{messages.map((message: any) => <div key={message.id} className={`message ${message.role}`}><div className="message-role">{message.role}</div><div>{message.content}</div></div>)}</div></section>
  </main>;
}
