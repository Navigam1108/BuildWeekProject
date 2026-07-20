import unittest

from matching.engine import Order, OrderBook


class Invariants(unittest.TestCase):
    def test_cancelled_orders_do_not_reappear(self):
        book = OrderBook()
        book.place(Order("old", "buy", 100, 1))
        book.place(Order("new", "buy", 101, 1))
        book.cancel("new")
        self.assertEqual(book.best_price("buy"), 100)
