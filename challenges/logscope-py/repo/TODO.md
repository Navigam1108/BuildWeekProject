# Event-store implementation seams

`QueryEngine` remains the public facade. Its `QueryHints` dependency is
deliberately unimplemented, so all requests safely use the historical scan
paths until a candidate chooses to add indexes.

- Preserve inclusive timestamp semantics while introducing a time-range path.
- Keep ingest, duplicate suppression, and retention coherent with any index.
- Produce deterministic source summaries without sorting unnecessary data.

The work is intentionally distributed across query, ingestion, and retention
modules. Benchmark one change at a time.
