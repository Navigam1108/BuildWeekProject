# Gateway project brief

Gateway is a small TypeScript package with a response cache under `src/`. The
public class is `ResponseCache`, with `get`, `set`, and `size` methods. A test
script is in `tests/` and a replay-like workload is in `benchmarks/`. Run `make
test` and `make bench` from the repository root.
