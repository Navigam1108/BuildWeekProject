# CAT-209 — Inventory search latency

Northstar's catalog service powers search, browse filters, and warehouse-aware
availability. The API is correct but performs repeated full-catalog work. Keep
the public methods stable while improving the production-shaped hot paths.

## Investigation scope

Read the service facade, data model, index seam, tests, and benchmark together.
`TODO.md` describes intentionally blank extension points; preserving browse
order and missing-result behavior matters as much as raw lookup speed.
