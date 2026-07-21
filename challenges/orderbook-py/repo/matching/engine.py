from .history import TradeHistory
from .indexes import OrderIndexes
from .models import Order, Trade


class OrderBook:
    """Small in-memory matching facade used by the market-data service."""

    def __init__(self) -> None:
        self.orders: list[Order] = []
        self.trades: list[Trade] = []
        self.indexes = OrderIndexes()
        self.history = TradeHistory()

    def place(self, order: Order) -> list[Trade]:
        self.orders.append(order)
        self.indexes.record(order)
        return self.match()

    def cancel(self, order_id: str) -> bool:
        indexed = self.indexes.find(order_id)
        if indexed is not None:
            self.orders.remove(indexed)
            self.indexes.forget(order_id)
            return True
        for index, order in enumerate(self.orders):
            if order.order_id == order_id:
                self.orders.pop(index)
                self.indexes.forget(order_id)
                return True
        return False

    def best_price(self, side: str) -> int | None:
        indexed = self.indexes.best(side)
        if indexed is not None:
            return indexed
        prices = [order.price for order in self.orders if order.side == side]
        if not prices:
            return None
        return max(prices) if side == "buy" else min(prices)

    def depth(self, side: str, levels: int = 5) -> list[tuple[int, int]]:
        indexed = self.indexes.levels(side, levels)
        if indexed is not None:
            return indexed
        totals: dict[int, int] = {}
        for order in self.orders:
            if order.side == side:
                totals[order.price] = totals.get(order.price, 0) + order.quantity
        prices = sorted(totals, reverse=side == "buy")[:levels]
        return [(price, totals[price]) for price in prices]

    def match(self) -> list[Trade]:
        buys = sorted((order for order in self.orders if order.side == "buy"), key=lambda item: item.price, reverse=True)
        sells = sorted((order for order in self.orders if order.side == "sell"), key=lambda item: item.price)
        if not buys or not sells or buys[0].price < sells[0].price:
            return []
        buy, sell = buys[0], sells[0]
        trade = Trade(buy.order_id, sell.order_id, sell.price, min(buy.quantity, sell.quantity))
        self.orders = [order for order in self.orders if order.order_id not in {buy.order_id, sell.order_id}]
        self.indexes.forget(buy.order_id)
        self.indexes.forget(sell.order_id)
        self.trades.append(trade)
        self.history.append(trade)
        return [trade]

    def recent_trades(self, limit: int = 100) -> list[Trade]:
        indexed = self.history.recent(limit)
        if indexed is not None:
            return indexed
        return list(reversed(self.trades))[:limit][::-1]
