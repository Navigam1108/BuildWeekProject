# Matching-engine implementation seams

The API facade in `matching/engine.py` is intentionally backed by empty order
and trade-store collaborators. It falls back to the original scan-and-sort
logic until those seams are implemented.

- Decide how order identity, price levels, and cancellation lifecycle stay in
  sync during a match.
- Preserve price/time behavior while making best-price and depth reads cheap.
- Bound trade retention without changing the ordering returned by the API.

Do not try to rewrite the whole exchange. A strong interview outcome is a
well-reasoned improvement to two or three paths.
