# PayFix project brief

PayFix is a small Python reconciliation package. Its public entry point is
`payfix.reconcile.reconcile`, which accepts `Payment` and `LedgerEntry` records
and returns matching payments. Tests are in `tests/`, and a repeatable workload
is in `benchmarks/`. Run `make test` and `make bench` from the repository root.
