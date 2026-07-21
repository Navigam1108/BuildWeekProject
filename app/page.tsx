import Image from "next/image"
import Link from "next/link"

const interviewSignals = [
  ["Explore", "Read a real service, trace the important paths, and understand the constraints before changing code."],
  ["Prioritize", "Choose the improvement with the strongest likely impact instead of chasing every available task."],
  ["Improve", "Make a focused change while preserving behavior and existing contracts."],
  ["Prove", "Use tests and benchmarks to show that the repository is both correct and meaningfully better."],
]

const evidence = [
  ["Live workspace", "A browser-based VS Code session where candidates investigate and implement in a real repository."],
  ["Measured progress", "Tests, benchmarks, and mission-level progress make partial improvements visible."],
  ["Interview evidence", "Review the work, elapsed time, scorecard, and the trade-offs behind the change."],
]

export default function HomePage() {
  return (
    <main className="shell landing-shell story-shell">
      <nav className="topbar story-nav">
        <div><div className="brand">Scout<span>.</span></div><div className="muted">Repository interview platform</div></div>
        <div className="story-nav-actions"><a href="#problem">Why Scout</a><a href="#format">Interview format</a><Link className="button" href="/admin">Open interviewer console</Link></div>
      </nav>

      <section className="story-hero">
        <div className="story-hero-art"><Image src="/demo/traditional-interview-pressure.png" alt="Engineer facing an empty editor and countdown clock" fill priority sizes="(max-width: 1240px) 100vw, 1180px" /></div>
        <div className="story-hero-shade" />
        <div className="story-hero-copy">
          <div className="eyebrow">The hiring-signal problem</div>
          <h1>A blank editor cannot show how an engineer works.</h1>
          <p>Traditional coding rounds reward puzzle recall under artificial pressure. They rarely reveal how a candidate understands an unfamiliar system, chooses a bottleneck, or proves an improvement is safe.</p>
          <div className="actions"><a className="button primary" href="#problem">See the interview problem</a><Link className="button story-hero-button" href="/admin">Run the live demo</Link></div>
        </div>
        <div className="story-hero-signals"><span>Real repository</span><span>Multiple improvement paths</span><span>Evidence-based review</span></div>
      </section>

      <section className="story-section story-problem" id="problem">
        <div className="story-section-intro"><div className="eyebrow">Why traditional rounds break down</div><h2>One isolated answer is a weak proxy for engineering judgment.</h2><p className="muted">The problem is not the candidate. It is an assessment that removes context, encourages pattern recall, and asks one answer to carry too much signal.</p></div>
        <div className="story-problem-grid">
          <article><span>01</span><h3>No system context</h3><p>A single prompt cannot show how someone reads a service, maps constraints, or finds the real hot path.</p></article>
          <article><span>02</span><h3>Recall over judgment</h3><p>Recognizing a trick is different from deciding what improvement is worth making in an existing system.</p></article>
          <article><span>03</span><h3>One-screen AI answers</h3><p>When a hidden tool can answer one prompt, the interview needs stronger evidence than the final code alone.</p></article>
        </div>
      </section>

      <section className="story-section story-split story-ai-section">
        <div className="story-visual-frame"><Image src="/demo/ai-assessment-dilemma.png" alt="Conceptual illustration of the AI assessment dilemma" width={1600} height={900} sizes="(max-width: 800px) 100vw, 56vw" /></div>
        <div className="story-copy-block"><div className="eyebrow">AI exposed the flaw</div><h2>Surveillance is not a better interview.</h2><p>One-screen answer tools make a puzzle-only assessment harder to trust. Adding more browser locks or camera checks does not reveal how someone thinks inside a real system.</p><p>Scout changes the format instead: candidates work in context, choose a path, and demonstrate impact with evidence.</p></div>
      </section>

      <section className="story-section story-split story-solution" id="format">
        <div className="story-copy-block"><div className="eyebrow">The Scout format</div><h2>Start with a real system. Let engineering judgment become visible.</h2><p>Scout is a growing library of production-shaped interview repositories. Every repository includes a realistic ticket, multiple files, tests, benchmarks, and several independently measurable opportunities to improve the system.</p><p>There is no prescribed solution and no expectation to finish everything. A strong candidate identifies a high-value opportunity, makes a focused change, and proves it worked.</p><Link className="button primary" href="/admin">Browse interview environments</Link></div>
        <div className="story-visual-frame story-solution-art"><Image src="/demo/repository-engineering-judgment.png" alt="Conceptual illustration of navigating and improving a repository" width={1600} height={900} sizes="(max-width: 800px) 100vw, 56vw" /></div>
      </section>

      <section className="story-section story-process">
        <div className="story-section-intro"><div className="eyebrow">A better interview signal</div><h2>One repository. Several credible ways to demonstrate impact.</h2></div>
        <div className="story-process-grid">{interviewSignals.map(([title, description], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p className="muted">{description}</p></article>)}</div>
      </section>

      <section className="story-section story-evidence">
        <div className="story-section-intro"><div className="eyebrow">The live interview</div><h2>Review evidence, not just the final answer.</h2><p className="muted">Use the live workspace and scorecard to guide a concrete conversation about what changed, why it was chosen, and what comes next.</p></div>
        <div className="story-evidence-grid">{evidence.map(([title, description], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
        <div className="story-live-cta"><div><div className="eyebrow">Ready for the live workflow?</div><h3>Choose a repository, open the candidate workspace, and review one real submission.</h3></div><Link className="button primary" href="/admin">Open interviewer console</Link></div>
      </section>

      <section className="story-build-note" id="built-with-codex">
        <div><div className="eyebrow">Built for OpenAI Builder Week</div><h2>From idea to working interview platform in under a night.</h2></div>
        <p>OpenAI Codex with GPT-5.6 accelerated the product scaffolding, repository-pack design, Docker workflow, and iterative debugging. The interview philosophy, scoring approach, review, and final product decisions remained human-directed.</p>
      </section>

      <section className="story-close"><div className="eyebrow">Scout</div><h2>Stop checking answers. Start evaluating engineering judgment.</h2><Link className="button primary" href="/admin">Start a repository interview</Link></section>
    </main>
  )
}
