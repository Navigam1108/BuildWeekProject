from .models import Order


class PriceLevels:
    def record(self, order: Order) -> None:
        return None

    def forget(self, order_id: str) -> None:
        return None

    def best(self, side: str) -> int | None:
        return None

    def levels(self, side: str, limit: int) -> list[tuple[int, int]] | None:
        return None
