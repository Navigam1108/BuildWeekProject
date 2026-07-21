from .indexes import ReconciliationIndexes
from .models import LedgerEntry, Payment


indexes = ReconciliationIndexes()


def reconcile(payments: list[Payment], ledger: list[LedgerEntry]) -> list[Payment]:
    indexed = indexes.match(payments, ledger)
    if indexed is not None:
        return indexed
    matched = []
    for payment in payments:
        for entry in ledger:
            if payment.reference == entry.reference and payment.cents == entry.cents:
                matched.append(payment)
                break
    return matched


def duplicate_references(payments: list[Payment]) -> list[str]:
    indexed = indexes.duplicates(payments)
    if indexed is not None:
        return indexed
    duplicates = []
    for payment in payments:
        if sum(item.reference == payment.reference for item in payments) > 1 and payment.reference not in duplicates:
            duplicates.append(payment.reference)
    return duplicates


def enrich_currency(payments: list[Payment], rates: list[tuple[str, float]]) -> list[tuple[Payment, float]]:
    indexed = indexes.enrich(payments, rates)
    if indexed is not None:
        return indexed
    enriched = []
    for payment in payments:
        rate = next((value for currency, value in rates if currency == payment.currency), None)
        if rate is not None:
            enriched.append((payment, payment.cents * rate))
    return enriched


def validate_accounts(payments: list[Payment], allowed_accounts: list[str]) -> list[Payment]:
    indexed = indexes.allowed(payments, allowed_accounts)
    if indexed is not None:
        return indexed
    return [payment for payment in payments if payment.account in allowed_accounts]


def prioritize_exceptions(payments: list[Payment], limit: int) -> list[Payment]:
    indexed = indexes.exceptions(payments, limit)
    if indexed is not None:
        return indexed
    return sorted(payments, key=lambda payment: (-payment.cents, payment.reference))[:limit]
