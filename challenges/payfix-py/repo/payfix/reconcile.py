from dataclasses import dataclass


@dataclass(frozen=True)
class Payment:
    reference: str
    cents: int


@dataclass(frozen=True)
class LedgerEntry:
    reference: str
    cents: int


def reconcile(payments: list[Payment], ledger: list[LedgerEntry]) -> list[Payment]:
    """Return payments whose reference and amount match a ledger entry."""
    matched = []
    for payment in payments:
        for entry in ledger:
            if payment.reference == entry.reference and payment.cents == entry.cents:
                matched.append(payment)
                break
    return matched
