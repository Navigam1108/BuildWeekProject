from collections import Counter
from dataclasses import dataclass
from heapq import nsmallest


@dataclass(frozen=True)
class Payment:
    reference: str
    cents: int
    currency: str = "USD"
    account: str = "default"


@dataclass(frozen=True)
class LedgerEntry:
    reference: str
    cents: int
    currency: str = "USD"
    account: str = "default"


def reconcile(payments: list[Payment], ledger: list[LedgerEntry]) -> list[Payment]:
    ledger_keys = {(entry.reference, entry.cents) for entry in ledger}
    return [payment for payment in payments if (payment.reference, payment.cents) in ledger_keys]


def duplicate_references(payments: list[Payment]) -> list[str]:
    counts = Counter(payment.reference for payment in payments)
    return [reference for reference, count in counts.items() if count > 1]


def enrich_currency(payments: list[Payment], rates: list[tuple[str, float]]) -> list[tuple[Payment, float]]:
    rate_by_currency = dict(rates)
    return [(payment, payment.cents * rate_by_currency[payment.currency]) for payment in payments if payment.currency in rate_by_currency]


def validate_accounts(payments: list[Payment], allowed_accounts: list[str]) -> list[Payment]:
    allowed = set(allowed_accounts)
    return [payment for payment in payments if payment.account in allowed]


def prioritize_exceptions(payments: list[Payment], limit: int) -> list[Payment]:
    return nsmallest(limit, payments, key=lambda payment: (-payment.cents, payment.reference))
