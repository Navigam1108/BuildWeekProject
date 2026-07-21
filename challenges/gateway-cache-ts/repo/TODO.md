# Gateway implementation seams

The response-cache facade delegates to `src/cache-seams` before it performs
the legacy array work. Its methods are deliberately blank and return
`undefined`, so adding an index is opt-in and the current API remains usable.

- Keep recency, expiry, tags, and replacement semantics consistent.
- Make request coalescing safe when loaders reject.
- Canonicalize headers without relying on their incoming order.

The five benchmarks represent distinct paths. Choose the changes you can
validate rather than attempting a broad rewrite.
