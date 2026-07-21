# Gateway project brief

Gateway provides a bounded response cache for a hot API path. `ResponseCache`
also owns expiry cleanup, header canonicalization, shared in-flight requests,
and tag-based removal. The repository includes replay-style benchmarks and
tests; run `make test` and `make bench` from the repository root.
