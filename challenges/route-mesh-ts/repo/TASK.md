# EDGE-386 — Route resolution latency

RouteMesh receives multi-tenant API traffic and turns a request into a route,
middleware chain, backend, and policy decision. The public API is correct but
does linear work repeatedly. Preserve `Router.resolve` and related methods.

The five production paths are `resolve`, `middleware`, `backend`, `authorized`,
and `cached`. `invalidate(prefix)` removes compiled entries for a deployed route
prefix. The benchmark reports each path independently.

## Investigation scope

Route facade, route-store seam, policy fixtures, tests, and benchmark must be
read together. `TODO.md` describes intentionally blank extension points;
preserve longest-prefix and invalidation behavior while improving a subset.
