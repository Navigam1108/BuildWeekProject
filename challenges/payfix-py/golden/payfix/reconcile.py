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
    ledger_keys = {(entry.reference, entry.cents) for entry in ledger}
    return [payment for payment in payments if (payment.reference, payment.cents) in ledger_keys]
