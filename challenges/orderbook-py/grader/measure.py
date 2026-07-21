import json
import time

from matching.engine import Order, OrderBook, Trade


BASELINES = {"order-lookup": 55.0, "best-price": 55.0, "price-level": 70.0, "depth": 24.0, "trade-history": 25.0}
GOLDENS = {"order-lookup": 0.5, "best-price": 0.3, "price-level": 3.0, "depth": 3.0, "trade-history": 1.2}


def elapsed(operation):
    start = time.perf_counter()
    operation()
    return round((time.perf_counter() - start) * 1000, 3)


def order_lookup():
    book = OrderBook()
    for index in range(3_000):
        book.place(Order(f"buy-{index}", "buy", 10_000, 1))
    return elapsed(lambda: [book.cancel(f"buy-{index}") for index in range(2_000, 3_000)])


def best_price():
    book = OrderBook()
    for index in range(2_000):
        book.place(Order(f"buy-{index}", "buy", 10_000 + index, 1))
    return elapsed(lambda: [book.best_price("buy") for _ in range(1_000)])


def price_level():
    book = OrderBook()
    return elapsed(lambda: [book.place(Order(f"buy-{index}", "buy", 10_000, 1)) for index in range(1_200)])


def depth_snapshot():
    book = OrderBook()
    for index in range(2_000):
        book.place(Order(f"buy-{index}", "buy", 10_000 + index % 250, 1))
    return elapsed(lambda: [book.depth("buy", 20) for _ in range(150)])


def trade_history():
    book = OrderBook()
    book.trades.extend(Trade(f"b-{index}", f"s-{index}", 100, 1) for index in range(20_000))
    return elapsed(lambda: [book.recent_trades(100) for _ in range(200)])


def checks():
    cancel = OrderBook()
    cancel.place(Order("old", "buy", 100, 1))
    cancel.place(Order("new", "buy", 101, 1))
    cancelled = cancel.cancel("new") and cancel.best_price("buy") == 100
    quote = OrderBook()
    quote.place(Order("low", "buy", 100, 1))
    quote.place(Order("high", "buy", 101, 1))
    best = quote.best_price("buy") == 101
    level = OrderBook()
    level.place(Order("one", "buy", 100, 2))
    level.place(Order("two", "buy", 100, 3))
    queued = level.depth("buy") == [(100, 5)]
    snapshot = OrderBook()
    snapshot.place(Order("one", "sell", 102, 2))
    snapshot.place(Order("two", "sell", 101, 3))
    depth = snapshot.depth("sell") == [(101, 3), (102, 2)]
    history = OrderBook()
    history.place(Order("buy", "buy", 110, 1))
    history.place(Order("sell", "sell", 100, 1))
    retained = len(history.recent_trades()) == 1
    return {"order-lookup": cancelled, "best-price": best, "price-level": queued, "depth": depth, "trade-history": retained}


def main():
    operations = {"order-lookup": order_lookup, "best-price": best_price, "price-level": price_level, "depth": depth_snapshot, "trade-history": trade_history}
    verified = checks()
    missions = []
    for mission_id, operation in operations.items():
        candidate = operation()
        baseline, golden = BASELINES[mission_id], GOLDENS[mission_id]
        # A starter implementation is correct but deliberately slow.  Credit a
        # mission only after the candidate has covered most of its path to the
        # staff baseline, rather than rewarding incidental host-speed variance.
        threshold = baseline - max(0, baseline - golden) * 0.75
        missions.append({"id": mission_id, "baseline_ms": baseline, "candidate_ms": candidate, "golden_ms": golden, "passed": verified[mission_id] and candidate <= threshold})
    print(json.dumps({"missions": missions}))


if __name__ == "__main__":
    main()
