from dataclasses import dataclass


@dataclass(frozen=True)
class Order:
    order_id: str
    side: str
    price: int
    quantity: int


@dataclass(frozen=True)
class Trade:
    buy_order_id: str
    sell_order_id: str
    price: int
    quantity: int


class OrderBook:
    """Small in-memory matching facade used by the market-data service."""

    def __init__(self) -> None:
        self.orders: list[Order] = []
        self.trades: list[Trade] = []

    def place(self, order: Order) -> list[Trade]:
        self.orders.append(order)
        return self.match()

    def cancel(self, order_id: str) -> bool:
        for index, order in enumerate(self.orders):
            if order.order_id == order_id:
                self.orders.pop(index)
                return True
        return False

    def best_price(self, side: str) -> int | None:
        prices = [order.price for order in self.orders if order.side == side]
        if not prices:
            return None
        return max(prices) if side == "buy" else min(prices)

    def depth(self, side: str, levels: int = 5) -> list[tuple[int, int]]:
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
        self.trades.append(trade)
        return [trade]

    def recent_trades(self, limit: int = 100) -> list[Trade]:
        return self.trades[-limit:]
