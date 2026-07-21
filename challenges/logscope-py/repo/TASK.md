# PERF-2847: event-store hot paths

LogScope is falling behind its ingestion and query SLA during a tenant replay.
The on-call report points to slow time-window reads, source-scoped searches,
retention sweeps, source summaries, and duplicate event suppression. Keep the
existing public behavior intact while improving the hot paths that matter.

Run `make test` for correctness and `make bench` for the repeatable workload.

## Investigation scope

Query, ingestion, retention, and model modules share the production contract.
`TODO.md` names intentionally blank query seams; keep the event lifecycle
coherent and optimize only the paths you can measure confidently.
