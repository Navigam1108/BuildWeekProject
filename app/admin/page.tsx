"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Challenge = { slug: string; title: string; language: string; level: string };
type Session = { id: string; candidate_name: string; title: string; status: string; created_at: string; agent_enabled: number; token: string };

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [candidate, setCandidate] = useState("");
  const [challengeSlug, setChallengeSlug] = useState("");
  const [duration, setDuration] = useState("60");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const [challengeResponse, sessionResponse] = await Promise.all([fetch("/api/challenges"), fetch("/api/sessions")]);
    if (challengeResponse.ok) {
      const data = await challengeResponse.json() as Challenge[];
      setChallenges(data); if (!challengeSlug) setChallengeSlug(data[0]?.slug || "");
      setLoggedIn(true);
    }
    if (sessionResponse.ok) setSessions(await sessionResponse.json());
  }, [challengeSlug]);
  useEffect(() => { void load(); }, [load]);

  async function login(event: FormEvent) {
    event.preventDefault(); setMessage("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    if (!response.ok) { setMessage("Invalid password"); return; }
    await load();
  }

  async function create(event: FormEvent) {
    event.preventDefault(); setMessage("Creating session…");
    const response = await fetch("/api/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ challenge_slug: challengeSlug, candidate_name: candidate, duration_min: Number(duration) }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Could not create session"); return; }
    setMessage(`Candidate link ready: ${data.candidateUrl} | IDE password: ${data.idePassword}`); setCandidate(""); await load();
  }

  if (!loggedIn) return <main className="shell"><div className="brand">Scout<span>.</span></div><section className="hero"><div className="eyebrow">Interviewer access</div><h1>Open the dashboard.</h1><form className="form" onSubmit={login}><div className="field"><label>Admin password</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus /></div><button className="button primary" type="submit">Sign in</button>{message && <div className="notice error">{message}</div>}</form></section></main>;

  return <main className="shell">
    <div className="topbar"><div><div className="brand">Scout<span>.</span></div><div className="muted">Interviewer dashboard</div></div><Link href="/" className="button">Home</Link></div>
    <div className="grid two">
      <section className="card"><div className="eyebrow">New interview</div><h2>Create a session</h2><form className="form" onSubmit={create}><div className="field"><label>Challenge</label><select value={challengeSlug} onChange={(event) => setChallengeSlug(event.target.value)}>{challenges.map((challenge) => <option key={challenge.slug} value={challenge.slug}>{challenge.title} · {challenge.level}</option>)}</select></div><div className="field"><label>Candidate name</label><input required value={candidate} onChange={(event) => setCandidate(event.target.value)} placeholder="Alex Engineer" /></div><div className="field"><label>Duration (minutes)</label><input type="number" min="5" max="240" value={duration} onChange={(event) => setDuration(event.target.value)} /></div><button className="button primary" type="submit">Create candidate workspace</button>{message && <div className="notice">{message}</div>}</form></section>
      <section className="card"><div className="eyebrow">Session evidence</div><h2>{sessions.length} sessions</h2><p className="muted">Open a live session to toggle Scout, watch the transcript, and review the latest report.</p><div className="notice">Candidate conversations are visible to the interviewer by design.</div></section>
    </div>
    <section className="card" style={{ marginTop: 16 }}><div className="split"><h2>Recent sessions</h2><button className="button" onClick={() => void load()}>Refresh</button></div><div className="table-wrap"><table><thead><tr><th>Candidate</th><th>Challenge</th><th>Status</th><th>Created</th><th /></tr></thead><tbody>{sessions.map((session) => <tr key={session.id}><td>{session.candidate_name}</td><td>{session.title}</td><td><span className={`pill ${session.status === "active" ? "live" : ""}`}>{session.status}</span></td><td>{new Date(session.created_at).toLocaleString()}</td><td><Link className="button" href={`/admin/sessions/${session.id}`}>Open</Link></td></tr>)}</tbody></table></div></section>
  </main>;
}
