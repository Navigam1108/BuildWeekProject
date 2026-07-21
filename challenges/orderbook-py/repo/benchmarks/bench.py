import time
import json
from pathlib import Path

from matching.engine import Order, OrderBook


try:
    variant = json.loads(Path(__file__).with_name("variant.json").read_text())["fixture"]
except FileNotFoundError:
    variant = {"count_multiplier": 1.0, "index_offset": 0, "hotspot_mod": 0, "burst_repeats": 1}

order_count = round(3_000 * variant["count_multiplier"])
cancel_count = round(1_000 * variant["count_multiplier"])
price_band = 250 + variant["hotspot_mod"]
burst_repeats = variant["burst_repeats"]


book = OrderBook()
start = time.perf_counter()
for index in range(order_count):
    book.place(Order(f"buy-{index}", "buy", 10_000 - (index + variant["index_offset"]) % price_band, 1))
    book.place(Order(f"sell-{index}", "sell", 10_500 + (index + variant["index_offset"]) % price_band, 1))
for index in range(cancel_count):
    book.cancel(f"buy-{index}")
for _ in range(burst_repeats):
    for index in range(cancel_count):
        book.best_price("buy")
        book.depth("sell")
elapsed = (time.perf_counter() - start) * 1000
print(f"candidate_ms={elapsed:.2f} open_orders={len(book.orders)}")
