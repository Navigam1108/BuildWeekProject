# Feed assembly implementation seams

The feed facade is intentionally wired through `FeedStores`, whose operations
are empty. It falls back to the legacy in-memory behavior so the public API is
safe to explore.

- Reconcile duplicate identity, seen-item filtering, and source order.
- Build a topic-affinity representation appropriate for the hot path.
- Use a bounded ranking strategy without changing feed tie behavior.

Choose a coherent subset. The benchmark separates merge, affinity, ranking,
suppression, and refresh work.
