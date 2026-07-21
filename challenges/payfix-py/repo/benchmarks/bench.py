import time

from payfix.reconcile import (
    LedgerEntry,
    Payment,
    duplicate_references,
    enrich_currency,
    prioritize_exceptions,
    reconcile,
    validate_accounts,
)


def timed(callback):
    start = time.perf_counter()
    callback()
    return round((time.perf_counter() - start) * 1000, 2)


payments = [Payment(f"ref-{index % 4_000}", index, ("USD", "EUR", "GBP")[index % 3], f"account-{index % 350}") for index in range(6_000)]
ledger = [LedgerEntry(f"ref-{index}", index) for index in range(4_000)]
rates = [(f"CUR-{index}", 1.0 + index / 100) for index in range(200)] + [("USD", 1.0), ("EUR", 1.1), ("GBP", 1.25)]
allowed = [f"account-{index}" for index in range(350)]
exceptions = payments * 20
metrics = {
    "matching": timed(lambda: reconcile(payments, ledger)),
    "duplicates": timed(lambda: duplicate_references(payments)),
    "currency": timed(lambda: enrich_currency(payments, rates)),
    "validation": timed(lambda: validate_accounts(payments, allowed)),
    "exceptions": timed(lambda: prioritize_exceptions(exceptions, 25)),
}
print(" ".join(f"{name}_ms={value:.2f}" for name, value in metrics.items()))
