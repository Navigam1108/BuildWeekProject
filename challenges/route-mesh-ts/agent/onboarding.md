# RouteMesh — API route resolution

RouteMesh is a small JavaScript module that resolves API routes, middleware,
backends, and tenant policies in an edge gateway. The public entry point is the
`Router` class exported from `src/router.mjs`.

- `src/router.mjs` — single-file `Router` class with route resolution,
  middleware chain lookup, weighted backend selection, tenant authorization,
  and route caching.

The repository includes tests under `tests/` and a benchmark under
`benchmarks/`. Run `make test` and `make bench` from the repository root.
