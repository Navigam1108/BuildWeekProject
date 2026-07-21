# FEED-443 — Recommendation assembly latency

Pulse Feed merges candidate sources, applies user affinity, filters previously
seen content, and publishes the highest-value items. The API serves correct
results, but the current implementation cannot keep up with traffic. Preserve
the `FeedBuilder` API and improve its hot path.

## Investigation scope

Candidate merge, affinity, filtering, ranking, and refresh are intentionally
split across facade, model, and store modules. `TODO.md` contains blank seams;
preserve feed ordering and choose the work with the clearest measured impact.
