import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <nav className="topbar"><div className="brand">Scout<span>.</span></div><span className="pill">Live coding, with guardrails</span></nav>
      <section className="hero">
        <div className="eyebrow">Evidence-based technical interviews</div>
        <h1>See how engineers investigate real code.</h1>
        <p>Scout gives candidates navigation help without solving the task, while interviewers get reproducible tests, benchmark deltas, diffs, and a transparent transcript.</p>
        <div className="actions"><Link className="button primary" href="/admin">Open interviewer dashboard</Link><Link className="button" href="/admin">Create a demo session</Link></div>
      </section>
      <section className="grid three">
        <div className="card"><div className="stat">01</div><h3>Real codebases</h3><p className="muted">Candidates work inside a realistic repository with a buried performance problem.</p></div>
        <div className="card"><div className="stat">02</div><h3>Guardrailed Scout</h3><p className="muted">The agent answers where and what questions, but refuses to diagnose or solve.</p></div>
        <div className="card"><div className="stat">03</div><h3>Evidence, not vibes</h3><p className="muted">Visible tests, hidden tests, benchmark deltas, code diffs, and the full interview transcript.</p></div>
      </section>
    </main>
  );
}
