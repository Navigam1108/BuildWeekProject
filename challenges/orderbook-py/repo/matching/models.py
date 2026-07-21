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
