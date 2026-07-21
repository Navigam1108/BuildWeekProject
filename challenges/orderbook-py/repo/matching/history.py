from .models import Trade


class TradeHistory:
    def append(self, trade: Trade) -> None:
        return None

    def recent(self, limit: int) -> list[Trade] | None:
        return None
