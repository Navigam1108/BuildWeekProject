from .models import LedgerEntry, Payment
from .exception_queue import ExceptionQueue
from .ledger_matcher import LedgerMatcher
from .reference_data import ReferenceData


class ReconciliationIndexes:
    def __init__(self) -> None:
        self.ledger = LedgerMatcher()
        self.reference_data = ReferenceData()
        self.exceptions_queue = ExceptionQueue()


    def match(self, payments: list[Payment], ledger: list[LedgerEntry]) -> list[Payment] | None:
        return self.ledger.match(payments, ledger)

    def duplicates(self, payments: list[Payment]) -> list[str] | None:
        return self.ledger.duplicates(payments)

    def enrich(self, payments: list[Payment], rates: list[tuple[str, float]]) -> list[tuple[Payment, float]] | None:
        return self.reference_data.enrich(payments, rates)

    def allowed(self, payments: list[Payment], accounts: list[str]) -> list[Payment] | None:
        return self.reference_data.allowed(payments, accounts)

    def exceptions(self, payments: list[Payment], limit: int) -> list[Payment] | None:
        return self.exceptions_queue.select(payments, limit)
