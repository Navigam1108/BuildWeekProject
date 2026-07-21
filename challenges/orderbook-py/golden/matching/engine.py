from collections import deque
from itertools import islice
from dataclasses import dataclass
import heapq


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
    def __init__(self) -> None:
        self.orders: dict[str, Order] = {}
        self._levels = {"buy": {}, "sell": {}}
        self._depth = {"buy": {}, "sell": {}}
        self._heaps = {"buy": [], "sell": []}
        self.trades: deque[Trade] = deque(maxlen=10_000)

    def place(self, order: Order) -> list[Trade]:
        self.orders[order.order_id] = order
        level = self._levels[order.side].setdefault(order.price, deque())
        level.append(order.order_id)
        self._depth[order.side][order.price] = self._depth[order.side].get(order.price, 0) + order.quantity
        heapq.heappush(self._heaps[order.side], -order.price if order.side == "buy" else order.price)
        return self.match()

    def cancel(self, order_id: str) -> bool:
        order = self.orders.pop(order_id, None)
        if not order:
            return False
        self._depth[order.side][order.price] -= order.quantity
        return True

    def best_price(self, side: str) -> int | None:
        heap = self._heaps[side]
        while heap:
            price = -heap[0] if side == "buy" else heap[0]
            if self._depth[side].get(price, 0) > 0:
                return price
            heapq.heappop(heap)
        return None

    def depth(self, side: str, levels: int = 5) -> list[tuple[int, int]]:
        prices = sorted((price for price, quantity in self._depth[side].items() if quantity > 0), reverse=side == "buy")[:levels]
        return [(price, self._depth[side][price]) for price in prices]

    def match(self) -> list[Trade]:
        buy_price, sell_price = self.best_price("buy"), self.best_price("sell")
        if buy_price is None or sell_price is None or buy_price < sell_price:
            return []
        buy_id = next((item for item in self._levels["buy"][buy_price] if item in self.orders), None)
        sell_id = next((item for item in self._levels["sell"][sell_price] if item in self.orders), None)
        if not buy_id or not sell_id:
            return []
        buy, sell = self.orders[buy_id], self.orders[sell_id]
        self.cancel(buy_id)
        self.cancel(sell_id)
        trade = Trade(buy_id, sell_id, sell.price, min(buy.quantity, sell.quantity))
        self.trades.append(trade)
        return [trade]

    def recent_trades(self, limit: int = 100) -> list[Trade]:
        return list(reversed(list(islice(reversed(self.trades), limit))))
