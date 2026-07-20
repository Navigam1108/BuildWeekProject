# Mercury Exchange — matching engine

OrderBook is a small Python package that models a limit-order matching service.
The public entry point is `matching.OrderBook`. Orders and trades are
represented by `Order` and `Trade` dataclass records.

- `matching/engine.py` — core `OrderBook` class with place, cancel, best-price,
  depth snapshot, match, and trade-retention methods.
- `matching/__init__.py` — re-exports `Order`, `OrderBook`, `Trade`.

The repository includes a unittest suite under `tests/` and a benchmark under
`benchmarks/`. Run `make test` and `make bench` from the repository root.
