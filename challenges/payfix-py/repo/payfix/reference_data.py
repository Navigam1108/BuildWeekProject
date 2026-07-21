from .models import Payment


class ReferenceData:
    def enrich(self, payments: list[Payment], rates: list[tuple[str, float]]) -> list[tuple[Payment, float]] | None:
        return None

    def allowed(self, payments: list[Payment], accounts: list[str]) -> list[Payment] | None:
        return None
