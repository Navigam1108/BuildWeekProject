import Link from "next/link"

const interviewSignals = [
  ["Investigate", "Trace a real service, identify the hot path, and choose what is worth fixing first."],
  ["Build", "Improve a scoped part of the codebase while preserving contracts and invariants."],
  ["Prove", "Use tests and benchmarks to show the change is correct and materially faster."],
  ["Explain", "Discuss prioritization, trade-offs, and what you would improve next."],
]

export default function HomePage() {
  return (
    <main className="shell landing-shell">
      <nav className="topbar landing-nav">
        <div><div className="brand">Scout<span>.</span></div><div className="muted">Repository interview platform</div></div>
        <Link className="button" href="/admin">Open interviewer console</Link>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="eyebrow">Technical interviews for real engineering work</div>
          <h1>Stop interviewing for a blank editor.</h1>
          <p className="landing-lede">LeetCode-style rounds reward memorized patterns under artificial constraints. They rarely show how a candidate investigates an unfamiliar service, prioritizes a real bottleneck, or makes a safe production-minded change.</p>
          <p>Scout is an interview platform for evaluating those skills. Candidates work in a multi-file repository, improve a performance-sensitive service, and show their reasoning with tests and benchmark evidence.</p>
          <div className="actions">
            <Link className="button primary" href="/admin">Browse interview environments</Link>
            <Link className="button" href="/admin">Start a demo interview</Link>
          </div>
        </div>
        <aside className="landing-proof-card">
          <div className="eyebrow">The Scout format</div>
          <div className="landing-stat"><strong>9</strong><span>production-shaped interview repositories</span></div>
          <div className="landing-stat"><strong>5</strong><span>independent engineering missions per interview</span></div>
          <div className="landing-stat"><strong>3</strong><span>candidate runtimes: Python, TypeScript, and C++</span></div>
          <p className="muted">Designed for roughly an hour. Sessions stay open until the interviewer ends them.</p>
        </aside>
      </section>

      <section className="landing-section">
        <div className="landing-section-heading">
          <div className="eyebrow">The interview problem</div>
          <h2>Algorithms matter. Isolated puzzles are not the whole job.</h2>
          <p className="muted">A great engineer needs algorithmic thinking, but uses it in the context of interfaces, data flow, observability, failure modes, and existing code.</p>
        </div>
        <div className="landing-problem-grid">
          <article className="landing-problem-card"><span className="landing-problem-number">01</span><h3>No codebase context</h3><p className="muted">A single-function prompt cannot assess how someone reads a service, maps ownership, or finds the true bottleneck.</p></article>
          <article className="landing-problem-card"><span className="landing-problem-number">02</span><h3>Memorization over judgment</h3><p className="muted">Recognizing a named pattern is different from deciding whether an index, cache, heap, or batch is the right trade-off.</p></article>
          <article className="landing-problem-card"><span className="landing-problem-number">03</span><h3>All-or-nothing scoring</h3><p className="muted">A candidate can demonstrate strong engineering by improving two missions safely. A puzzle-style pass/fail score often misses that signal.</p></article>
        </div>
      </section>

      <section className="landing-section landing-format-section">
        <div className="landing-section-heading">
          <div className="eyebrow">Interview format</div>
          <h2>One repository. Multiple credible ways to demonstrate impact.</h2>
        </div>
        <div className="landing-format-grid">
          <div className="landing-format-steps">{interviewSignals.map(([title, description], index) => <article className="landing-format-step" key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p className="muted">{description}</p></div></article>)}</div>
          <aside className="landing-comparison">
            <div className="eyebrow">What changes</div>
            <div className="landing-comparison-row"><span>Candidate task</span><strong>Production-shaped repository</strong></div>
            <div className="landing-comparison-row"><span>Interview signal</span><strong>Investigation and trade-offs</strong></div>
            <div className="landing-comparison-row"><span>Evidence</span><strong>Tests, benchmarks, mission scorecard</strong></div>
            <div className="landing-comparison-row"><span>Strong outcome</span><strong>2-3 well-executed improvements</strong></div>
          </aside>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-heading">
          <div className="eyebrow">Interviewer experience</div>
          <h2>Review evidence, not just the final answer.</h2>
        </div>
        <div className="grid three landing-evidence-grid">
          <article className="card"><div className="stat">01</div><h3>Real candidate workspace</h3><p className="muted">Every interview starts a fresh browser IDE and repository with visible tests and a replayable benchmark.</p></article>
          <article className="card"><div className="stat">02</div><h3>Mission-level progress</h3><p className="muted">See correctness, benchmark deltas, golden-reference context, and the subset of missions a candidate improved.</p></article>
          <article className="card"><div className="stat">03</div><h3>Structured interview review</h3><p className="muted">Use the session timeline, replay profile, elapsed time, and scorecard to guide a concrete follow-up conversation.</p></article>
        </div>
      </section>

      <section className="landing-cta">
        <div><div className="eyebrow">Ready to interview differently?</div><h2>Choose a repository and start the interview workspace.</h2><p className="muted">The interviewer console contains the current task catalog, session controls, grading evidence, and candidate workspace links.</p></div>
        <Link className="button primary" href="/admin">Go to interviewer console</Link>
      </section>
    </main>
  )
}
