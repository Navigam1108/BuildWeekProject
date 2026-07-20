# Scout Interview Platform

Scout is a live coding interview platform for realistic repository-level
performance tasks. Candidates work in a browser IDE and can ask a read-only
agent where code lives and how it is wired. Scout refuses to diagnose or solve
the challenge. Interviewers can toggle Scout live and review tests, benchmark
deltas, diffs, and the complete transcript.

## Why Scout

Technical interviews often force a poor trade-off: candidates get no help in
an unfamiliar codebase, or an AI assistant can accidentally solve the task.
Scout provides grounded navigation help with evidence that the guardrails held.

- Candidates get a real repository, browser IDE, task ticket, and a guide for
  locating code and understanding interfaces.
- Scout can search and read only the session repository. It has no write,
  shell, network, or grader tools.
- A deterministic policy gate blocks prompt injection and solution-seeking
  requests before they reach the model; the live transcript records the block.
- The interviewer gets a Session pulse of questions, grounded answers, policy
  blocks, and grade runs alongside the complete transcript and test evidence.

## Run locally

Requirements: Node.js 22+, Docker Desktop, and Python 3.12 for challenge
authoring/smoke tests.

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://localhost:3000/admin`. The default local password is
`demo-password`; set `ADMIN_PASSWORD` in `.env` before sharing a demo.

Build the candidate image before creating a real container-backed session:

```powershell
docker build -t challenge-py images/challenge-py
```

Set `AGENT_PROVIDER=anthropic` and `ANTHROPIC_API_KEY` for the cloud Scout
demo, or run Ollama and keep the default local provider.

Run the quality checks with:

```powershell
npm run typecheck
npm run lint
npm run build
```

## MVP demo flow

1. Sign in to `/admin` and create a `logscope-py` session.
2. Open the candidate link. Use `make test` and `make bench` in the IDE.
3. Ask Scout where `QueryEngine` is defined, then ask it to diagnose the slow query.
4. Toggle Scout off and on from the interviewer session page.
5. Apply the fix, resubmit, and inspect the report and transcript.

The first challenge deliberately fails the 200ms benchmark before the indexed
fix and passes after it. The challenge grader emits exactly one `REPORT_JSON:`
line, which the Next.js server stores in SQLite.

## Codex and GPT-5.6 build notes

This project was developed with Codex and GPT-5.6 as an implementation partner:
it accelerated the initial Next.js and Docker scaffolding, generated the three
challenge-pack skeletons, and helped iterate on the deterministic guardrail and
evidence-pulse design. The human builder defined the interview-safety boundary,
reviewed the code paths, and selected the final product behavior.

For a reproducible review, use the walkthrough above. The demo should show a
candidate asking a permitted navigation question, a blocked solution request in
the transcript, then a submission whose benchmark and test results appear in
the interviewer dashboard.

## Structure

- `app/`: Next.js pages and API routes
- `lib/db.ts`: SQLite schema and challenge seeding
- `lib/sessions.ts`: per-session repository and Docker lifecycle
- `lib/agent/`: Scout prompt, read-only tools, provider switch, and streaming
- `lib/grader.ts`: hidden grader execution and report persistence
- `challenges/logscope-py/`: first hand-curated challenge pack
- `images/`: candidate container image definitions

## Verification

```powershell
npm run typecheck
npm run lint
npm run build
Push-Location challenges/logscope-py/repo
$env:PYTHONPATH='.'
python -m unittest discover -s tests -v
python benchmarks/bench.py
Pop-Location
```

For the OpenAI Build Week submission, keep the README updated with how Codex
and GPT-5.6 were used, provide the repository/demo URL, the public YouTube
demo under three minutes, and the `/feedback` session ID for the primary build
thread.
