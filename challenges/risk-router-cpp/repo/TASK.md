# RISK-512 — Allocation router p99 regression

RiskRouter chooses a healthy processing shard for each incoming allocation. It
is intentionally small, but it models a production C++ service: nodes change
health, traffic is rack-aware, and callers request a stable topology snapshot.

The public `routing::ShardRouter` API is used by several services. Improve its
latency without changing public method signatures or routing only to unhealthy
nodes. Run `make test` and `make bench` from this directory.
