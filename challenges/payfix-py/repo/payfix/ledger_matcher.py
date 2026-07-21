from .models import LedgerEntry, Payment


class LedgerMatcher:
    def match(self, payments: list[Payment], ledger: list[LedgerEntry]) -> list[Payment] | None:
        return None

    def duplicates(self, payments: list[Payment]) -> list[str] | None:
        return None
