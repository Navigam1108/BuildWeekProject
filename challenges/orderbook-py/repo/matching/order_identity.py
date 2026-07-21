from .models import Order


class OrderIdentity:
    def record(self, order: Order) -> None:
        return None

    def forget(self, order_id: str) -> None:
        return None

    def find(self, order_id: str) -> Order | None:
        return None
