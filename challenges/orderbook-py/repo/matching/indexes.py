from .models import Order
from .order_identity import OrderIdentity
from .price_levels import PriceLevels


class OrderIndexes:
    def __init__(self) -> None:
        self.identity = OrderIdentity()
        self.prices = PriceLevels()

    def record(self, order: Order) -> None:
        self.identity.record(order)
        self.prices.record(order)

    def forget(self, order_id: str) -> None:
        self.identity.forget(order_id)
        self.prices.forget(order_id)

    def find(self, order_id: str) -> Order | None:
        return self.identity.find(order_id)

    def best(self, side: str) -> int | None:
        return self.prices.best(side)

    def levels(self, side: str, limit: int) -> list[tuple[int, int]] | None:
        return self.prices.levels(side, limit)
