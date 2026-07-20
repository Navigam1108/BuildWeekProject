# EDGE-386 — Route resolution latency

RouteMesh receives multi-tenant API traffic and turns a request into a route,
middleware chain, backend, and policy decision. The public API is correct but
does linear work repeatedly. Preserve `Router.resolve` and related methods.
