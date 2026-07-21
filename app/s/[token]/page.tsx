"use client"

import Link from "next/link"
import { use, useCallback, useEffect, useState } from "react"

type State = { title: string; task_md: string; status: string; ide_url: string | null; ide_password: string | null }

export default function CandidatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [state, setState] = useState<State | null>(null)
  const [tab, setTab] = useState<"task" | "guide">("task")
  const [notice, setNotice] = useState("")

  const load = useCallback(async () => {
    const response = await fetch(`/api/candidate/${token}`, { cache: "no-store" })
    if (response.ok) setState(await response.json())
  }, [token])

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), 5000)
    return () => clearInterval(timer)
  }, [load])

  async function submit() {
    if (!confirm("Submit your current work for grading? You can keep working afterward.")) return
    setNotice("Grading in progress...")
    try {
      const response = await fetch(`/api/candidate/${token}/submit`, { method: "POST" })
      const data = await response.json() as { ok?: boolean; error?: string }
      setNotice(response.ok && data.ok ? "Submitted. You can keep working and resubmit." : data.error || "Grading failed")
    } catch {
      setNotice("Unable to reach the grading service. Please submit again in a moment.")
    }
  }

  if (!state) return <main className="shell"><div className="muted">Loading workspace...</div></main>

  return <main className="workspace">
    <header className="workspace-bar">
      <div><div className="brand">Scout<span>.</span></div><div className="muted">{state.title}</div></div>
      <div className="actions" style={{ marginTop: 0 }}>
        <span className="pill coming-soon">AI guide coming soon</span>
        <button className="button primary" onClick={submit}>Submit</button>
        <Link href="/" className="button">Exit</Link>
      </div>
    </header>
    <div className="workspace-main">
      <section className="ide-frame">
        {state.ide_url ? <iframe title="Candidate IDE" src={state.ide_url} style={{ width: "100%", height: "100%", minHeight: "calc(100vh - 122px)", border: 0 }} /> : <div className="ide-placeholder"><div className="eyebrow">Workspace</div><h2>Code-server will appear here</h2><p className="muted">The session container is not connected yet. The challenge repository is still available to the grader.</p><div className="code">IDE password: {state.ide_password || "not available"}</div></div>}
      </section>
      <aside className="side-panel">
        <div className="actions" style={{ marginTop: 0 }}>
          <button className={`button ${tab === "task" ? "primary" : ""}`} onClick={() => setTab("task")}>Task</button>
          <button className={`button ${tab === "guide" ? "primary" : ""}`} onClick={() => setTab("guide")}>AI guide</button>
        </div>
        {tab === "task" ? <section><h2>Ticket</h2><div className="notice" style={{ whiteSpace: "pre-wrap" }}>{state.task_md}</div><h3 style={{ marginTop: 24 }}>How to run</h3><div className="code">make test{`\n`}make bench</div></section> : <section className="coming-soon-card">
          <div className="coming-soon-mark" aria-hidden="true">+</div>
          <div className="eyebrow">Coming soon</div>
          <h2>AI interview guide</h2>
          <p className="muted">A structured, non-solution guide is being prepared for future interviews. This demo keeps the focus on your repository investigation and measurable engineering work.</p>
          <div className="coming-soon-list">
            <div><strong>Repository orientation</strong><span>Find the right code without giving away an implementation.</span></div>
            <div><strong>Interview checkpoints</strong><span>Keep the conversation focused on evidence, trade-offs, and progress.</span></div>
          </div>
        </section>}
        {notice && <div className="notice" style={{ marginTop: 16 }}>{notice}</div>}
      </aside>
    </div>
  </main>
}
