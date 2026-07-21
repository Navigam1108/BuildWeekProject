# Router implementation seams

`ShardRouter` owns the stable public API. `TopologyCache` is intentionally
empty and lets all calls safely fall through to the original vector scans.

- Define cache lifecycle under registration, removal, and health changes.
- Preserve weighted-route determinism while avoiding expanded weight vectors.
- Decide when snapshots and rack views should be rebuilt or invalidated.

The system has several independent hot paths. A complete router rewrite is not
expected; measured improvement to a subset is a strong result.
