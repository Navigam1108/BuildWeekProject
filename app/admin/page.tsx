"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

type Challenge = {
  slug: string
  title: string
  language: string
  level: string
  domain: string
  summary: string
  mission_count: number
  dsa_topics: string[]
  repo_shape: string
  intentional_todos: number
}

type Session = {
  id: string
  candidate_name: string
  title: string
  status: string
  created_at: string
  ended_at: string | null
}

type CreatedSession = { candidateUrl: string; idePassword: string; id: string; title: string }

function elapsedLabel(startedAt: string, now: number, endedAt: string | null) {
  const total = Math.max(0, Math.floor(((endedAt ? new Date(endedAt).getTime() : now) - new Date(startedAt).getTime()) / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export default function AdminPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [busySlug, setBusySlug] = useState("")
  const [message, setMessage] = useState("")
  const [created, setCreated] = useState<CreatedSession | null>(null)
  const [copied, setCopied] = useState("")
  const [now, setNow] = useState(Date.now())

  const load = useCallback(async () => {
    const [challengeResponse, sessionResponse] = await Promise.all([fetch("/api/challenges"), fetch("/api/sessions")])
    if (challengeResponse.ok) setChallenges(await challengeResponse.json())
    if (sessionResponse.ok) setSessions(await sessionResponse.json())
  }, [])

  useEffect(() => {
    void load()
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [load])

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(`${label} copied`)
      window.setTimeout(() => setCopied(""), 1800)
    } catch {
      setCopied(`Could not copy ${label.toLowerCase()}`)
    }
  }

  async function startSession(challenge: Challenge) {
    setBusySlug(challenge.slug)
    setMessage(`Starting ${challenge.title}...`)
    setCreated(null)
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ challenge_slug: challenge.slug, candidate_name: "Demo candidate" }),
    })
    const data = await response.json()
    if (!response.ok) {
      setMessage(data.error || "Could not create session")
      setBusySlug("")
      return
    }
    setCreated({ ...data, title: challenge.title })
    setMessage("")
    setBusySlug("")
    await load()
  }

  return <main className="shell">
    <div className="topbar">
      <div><div className="brand">Scout<span>.</span></div><div className="muted">Repository interview demo</div></div>
      <Link href="/" className="button">Home</Link>
    </div>

    <section className="hero" style={{ paddingTop: 28 }}>
      <div className="eyebrow">Pick a production-shaped task</div>
      <h1>Browse a codebase. Start a session.</h1>
      <p>Each task is an open-ended repository investigation with five independently measurable opportunities. Sessions stay active until you end them.</p>
      {message && <div className="notice">{message}</div>}
    </section>

    {created && <section className="session-ready-card" aria-live="polite">
      <div className="session-ready-heading">
        <div>
          <div className="eyebrow">Workspace ready</div>
          <h2>{created.title}</h2>
          <p className="muted">Share the workspace link and IDE password with the candidate. They can open the browser IDE immediately.</p>
        </div>
        <div className="actions" style={{ marginTop: 0 }}>
          <a className="button primary" href={created.candidateUrl} target="_blank" rel="noreferrer">Open candidate workspace</a>
          <Link className="button" href={`/admin/sessions/${created.id}`}>Open interviewer view</Link>
          <button className="button" onClick={() => setCreated(null)}>Dismiss</button>
        </div>
      </div>
      <div className="workspace-credentials">
        <div className="credential">
          <span>Candidate workspace link</span>
          <div className="credential-value">
            <a className="code credential-link" href={created.candidateUrl} target="_blank" rel="noreferrer">{created.candidateUrl}</a>
            <button className="button" onClick={() => void copyText(created.candidateUrl, "Link")}>Copy link</button>
          </div>
        </div>
        <div className="credential">
          <span>IDE password</span>
          <div className="credential-value">
            <code className="code credential-password">{created.idePassword}</code>
            <button className="button" onClick={() => void copyText(created.idePassword, "Password")}>Copy password</button>
          </div>
        </div>
      </div>
      {copied && <div className="session-ready-feedback" role="status">{copied}</div>}
    </section>}

    <section className="card">
      <div className="split"><div><div className="eyebrow">Task catalog</div><h2>{challenges.length} interview environments</h2></div><button className="button" onClick={() => void load()}>Refresh list</button></div>
      <div className="portfolio-grid">{challenges.map((challenge) => <div className="portfolio-item" key={challenge.slug}>
        <div className="eyebrow">{challenge.domain} · {challenge.repo_shape}</div>
        <h3>{challenge.title}</h3>
        <p className="muted">{challenge.summary}</p>
        <span className="pill">{challenge.mission_count} missions · {challenge.language}</span>
        <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>DSA coverage: {challenge.dsa_topics.join(", ")} · {challenge.intentional_todos} implementation seams</p>
        <button className="button primary" style={{ marginTop: 14 }} disabled={Boolean(busySlug)} onClick={() => void startSession(challenge)}>{busySlug === challenge.slug ? "Starting..." : "Start session"}</button>
      </div>)}</div>
    </section>

    <section className="card" style={{ marginTop: 16 }}>
      <div className="split"><div><div className="eyebrow">Interviewer view</div><h2>Sessions</h2></div><span className="muted">Elapsed time updates live</span></div>
      <div className="table-wrap"><table><thead><tr><th>Candidate</th><th>Challenge</th><th>Status</th><th>Elapsed</th><th>Started</th><th /></tr></thead><tbody>{sessions.map((session) => <tr key={session.id}><td>{session.candidate_name}</td><td>{session.title}</td><td><span className={`pill ${session.status === "active" ? "live" : ""}`}>{session.status}</span></td><td><code>{elapsedLabel(session.created_at, now, session.ended_at)}</code></td><td>{new Date(session.created_at).toLocaleString()}</td><td><Link className="button" href={`/admin/sessions/${session.id}`}>Open</Link></td></tr>)}</tbody></table></div>
    </section>
  </main>
}
