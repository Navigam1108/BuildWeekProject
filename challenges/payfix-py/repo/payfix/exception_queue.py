from .models import Payment


class ExceptionQueue:
    def select(self, payments: list[Payment], limit: int) -> list[Payment] | None:
        return None
