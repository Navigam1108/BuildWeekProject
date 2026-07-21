"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Challenge = {
  slug: string;
  title: string;
  language: string;
  level: string;
  domain: string;
  summary: string;
  mission_count: number;
  dsa_topics: string[];
  repo_shape: string;
  intentional_todos: number;
};
type Session = { id: string; candidate_name: string; title: string; status: string; created_at: string; token: string };

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
      setChallenges(data);
      if (!challengeSlug) setChallengeSlug(data[0]?.slug || "");
      setLoggedIn(true);
    }
    if (sessionResponse.ok) setSessions(await sessionResponse.json());
  }, [challengeSlug]);
  useEffect(() => { void load(); }, [load]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    if (!response.ok) { setMessage("Invalid password"); return; }
    await load();
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    setMessage("Creating repository workspace…");
    const response = await fetch("/api/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ challenge_slug: challengeSlug, candidate_name: candidate, duration_min: Number(duration) }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Could not create session"); return; }
    setMessage(`Candidate link ready: ${data.candidateUrl} | IDE password: ${data.idePassword}`);
    setCandidate("");
    await load();
  }

  if (!loggedIn) return <main className="shell"><div className="brand">Scout<span>.</span></div><section className="hero"><div className="eyebrow">Interviewer access</div><h1>Open the repository interview dashboard.</h1><form className="form" onSubmit={login}><div className="field"><label>Admin password</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus /></div><button className="button primary" type="submit">Sign in</button>{message && <div className="notice error">{message}</div>}</form></section></main>;

  const selectedChallenge = challenges.find((challenge) => challenge.slug === challengeSlug);
  return <main className="shell">
    <div className="topbar"><div><div className="brand">Scout<span>.</span></div><div className="muted">Repository interview dashboard</div></div><Link href="/" className="button">Home</Link></div>
    <div className="grid two">
      <section className="card"><div className="eyebrow">New interview</div><h2>Create a session</h2><form className="form" onSubmit={create}><div className="field"><label>Challenge</label><select value={challengeSlug} onChange={(event) => setChallengeSlug(event.target.value)}>{challenges.map((challenge) => <option key={challenge.slug} value={challenge.slug}>{challenge.title} · {challenge.level}</option>)}</select></div>{selectedChallenge && <div className="notice"><strong>{selectedChallenge.mission_count} optimization missions</strong><br />{selectedChallenge.summary}</div>}<div className="field"><label>Candidate name</label><input required value={candidate} onChange={(event) => setCandidate(event.target.value)} placeholder="Alex Engineer" /></div><div className="field"><label>Duration (minutes)</label><input type="number" min="5" max="240" value={duration} onChange={(event) => setDuration(event.target.value)} /></div><button className="button primary" type="submit">Create candidate workspace</button>{message && <div className="notice">{message}</div>}</form></section>
      <section className="card"><div className="eyebrow">Repository portfolio</div><h2>{challenges.length} interview environments</h2><p className="muted">Each environment contains five independently measurable opportunities. Strong performance means improving two or three well, not completing everything.</p><div className="notice">Score investigation, safe changes, measured impact, and trade-offs—not one exact solution.</div></section>
    </div>
    <section className="card" style={{ marginTop: 16 }}><div className="split"><h2>Interview portfolio</h2><span className="muted">Candidate versions + staff-only golden baselines</span></div><div className="portfolio-grid">{challenges.map((challenge) => <div className="portfolio-item" key={challenge.slug}><div className="eyebrow">{challenge.domain} · {challenge.repo_shape}</div><h3>{challenge.title}</h3><p className="muted">{challenge.summary}</p><span className="pill">{challenge.mission_count} missions · {challenge.language}</span><p className="muted" style={{ marginTop: 10, fontSize: 13 }}>DSA coverage: {challenge.dsa_topics.join(", ")} · {challenge.intentional_todos} implementation seams</p></div>)}</div></section>
    <section className="card" style={{ marginTop: 16 }}><div className="split"><h2>Recent sessions</h2><button className="button" onClick={() => void load()}>Refresh</button></div><div className="table-wrap"><table><thead><tr><th>Candidate</th><th>Challenge</th><th>Status</th><th>Created</th><th /></tr></thead><tbody>{sessions.map((session) => <tr key={session.id}><td>{session.candidate_name}</td><td>{session.title}</td><td><span className={`pill ${session.status === "active" ? "live" : ""}`}>{session.status}</span></td><td>{new Date(session.created_at).toLocaleString()}</td><td><Link className="button" href={`/admin/sessions/${session.id}`}>Open</Link></td></tr>)}</tbody></table></div></section>
  </main>;
}
