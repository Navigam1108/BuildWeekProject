# FEED-443 — Recommendation assembly latency

Pulse Feed merges candidate sources, applies user affinity, filters previously
seen content, and publishes the highest-value items. The API serves correct
results, but the current implementation cannot keep up with traffic. Preserve
the `FeedBuilder` API and improve its hot path.
