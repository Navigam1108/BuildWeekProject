import time

from payfix.reconcile import LedgerEntry, Payment, reconcile


payments = [Payment(f"ref-{i}", i) for i in range(20_000)]
ledger = [LedgerEntry(f"ref-{i}", i) for i in range(20_000)]
start = time.perf_counter()
matched = reconcile(payments, ledger)
elapsed = (time.perf_counter() - start) * 1000
print(f"candidate_ms={elapsed:.2f} result_count={len(matched)}")
