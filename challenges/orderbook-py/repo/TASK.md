# EXCH-117 — Matching engine latency

Mercury Exchange accepts limit orders from market makers and publishes a compact
depth snapshot to downstream risk systems. During a burst, placement,
cancellation, matching, and snapshots all degrade together.

Improve the implementation without changing the public `OrderBook` API. Keep
price/time priority intact. Run `make test` for functional coverage and `make
bench` for a repeatable replay benchmark.

## Investigation scope

The facade, order indexes, trade history, models, tests, and replay workload
must agree on lifecycle semantics. `TODO.md` identifies blank seams. Improve a
well-tested subset rather than changing matching behavior speculatively.
