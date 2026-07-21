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
