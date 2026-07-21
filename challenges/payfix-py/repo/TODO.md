# Reconciliation implementation seams

`reconcile.py` owns the public batch API and intentionally delegates to an
empty `ReconciliationIndexes` collaborator before using its legacy fallback.

- Establish the correct identity for matching payment and ledger records.
- Preserve deterministic duplicate and exception ordering.
- Consider bounded selection rather than sorting entire failure batches.

The ticket is deliberately broader than one algorithm. Improve the parts you
can justify with tests and benchmark evidence.
