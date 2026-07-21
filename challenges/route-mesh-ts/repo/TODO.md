# Route-mesh implementation seams

The router facade calls `RouteStore` before falling back to the legacy arrays.
Every method is blank on purpose. This lets you improve a focused part of the
edge path while preserving the service contract.

- Respect longest-prefix routing and middleware ordering.
- Keep tenant authorization and cache invalidation aligned with route changes.
- Avoid changing weighted-choice determinism for a given ticket.

The benchmark separates route, middleware, backend, policy, and cache work;
choose the seams that make the most engineering sense.
