# Pulse Feed — recommendation assembly

Pulse Feed is a small Python package that assembles a personalized feed from
multiple candidate sources. The public entry point is `feed.FeedBuilder`.
Candidates are represented by `Item` dataclass records with an id, topic, and
score.

- `feed/builder.py` — core `FeedBuilder` class with candidate deduplication,
  seen-item suppression, topic-weighted ranking, and refresh tracking.
- `feed/__init__.py` — re-exports `FeedBuilder`, `Item`.

The repository includes a unittest suite under `tests/` and a benchmark under
`benchmarks/`. Run `make test` and `make bench` from the repository root.
