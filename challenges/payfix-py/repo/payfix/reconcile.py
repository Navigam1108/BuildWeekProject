from dataclasses import dataclass


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
    matched = []
    for payment in payments:
        for entry in ledger:
            if payment.reference == entry.reference and payment.cents == entry.cents:
                matched.append(payment)
                break
    return matched


def duplicate_references(payments: list[Payment]) -> list[str]:
    duplicates = []
    for payment in payments:
        if sum(item.reference == payment.reference for item in payments) > 1 and payment.reference not in duplicates:
            duplicates.append(payment.reference)
    return duplicates


def enrich_currency(payments: list[Payment], rates: list[tuple[str, float]]) -> list[tuple[Payment, float]]:
    enriched = []
    for payment in payments:
        rate = next((value for currency, value in rates if currency == payment.currency), None)
        if rate is not None:
            enriched.append((payment, payment.cents * rate))
    return enriched


def validate_accounts(payments: list[Payment], allowed_accounts: list[str]) -> list[Payment]:
    return [payment for payment in payments if payment.account in allowed_accounts]


def prioritize_exceptions(payments: list[Payment], limit: int) -> list[Payment]:
    return sorted(payments, key=lambda payment: (-payment.cents, payment.reference))[:limit]
