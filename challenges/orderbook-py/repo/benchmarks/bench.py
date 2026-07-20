import time

from matching.engine import Order, OrderBook


book = OrderBook()
start = time.perf_counter()
for index in range(3_000):
    book.place(Order(f"buy-{index}", "buy", 10_000 - index % 250, 1))
    book.place(Order(f"sell-{index}", "sell", 10_500 + index % 250, 1))
for index in range(1_000):
    book.cancel(f"buy-{index}")
    book.best_price("buy")
    book.depth("sell")
elapsed = (time.perf_counter() - start) * 1000
print(f"candidate_ms={elapsed:.2f} open_orders={len(book.orders)}")
