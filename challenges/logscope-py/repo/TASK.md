# PERF-2847: time-range query latency

LogScope is timing out on large time-range queries. The production-sized dataset
has a p99 around 4.2s, while the SLA is 200ms. Investigate and fix the issue
without changing the public API.

Run `make test` for correctness and `make bench` for the performance harness.
