import time
import json
from pathlib import Path

from payfix.reconcile import (
    LedgerEntry,
    Payment,
    duplicate_references,
    enrich_currency,
    prioritize_exceptions,
    reconcile,
    validate_accounts,
)


def load_variant():
    try:
        return json.loads(Path(__file__).with_name("variant.json").read_text())
    except FileNotFoundError:
        return {"fixture": {"count_multiplier": 1.0, "index_offset": 0, "hotspot_mod": 0, "burst_repeats": 1}}


variant = load_variant()["fixture"]
scale = variant["count_multiplier"]
offset = variant["index_offset"]
hotspot = variant["hotspot_mod"]
repeats = variant["burst_repeats"]


def timed(callback):
    start = time.perf_counter()
    callback()
    return round((time.perf_counter() - start) * 1000, 2)


payments = [Payment(f"ref-{(index + offset) % (4_000 + hotspot)}", index, ("USD", "EUR", "GBP")[index % 3], f"account-{index % (350 + hotspot)}") for index in range(round(6_000 * scale))]
ledger = [LedgerEntry(f"ref-{index + offset}", index) for index in range(round(4_000 * scale))]
rates = [(f"CUR-{index}", 1.0 + index / 100) for index in range(200)] + [("USD", 1.0), ("EUR", 1.1), ("GBP", 1.25)]
allowed = [f"account-{index}" for index in range(350 + hotspot)]
exceptions = payments * (20 * repeats)
metrics = {
    "matching": timed(lambda: reconcile(payments, ledger)),
    "duplicates": timed(lambda: duplicate_references(payments)),
    "currency": timed(lambda: enrich_currency(payments, rates)),
    "validation": timed(lambda: validate_accounts(payments, allowed)),
    "exceptions": timed(lambda: prioritize_exceptions(exceptions, 25)),
}
print(" ".join(f"{name}_ms={value:.2f}" for name, value in metrics.items()))
