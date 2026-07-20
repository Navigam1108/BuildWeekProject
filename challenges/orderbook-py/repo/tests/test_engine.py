import unittest

from matching.engine import Order, OrderBook


class OrderBookTests(unittest.TestCase):
    def test_matches_crossed_orders(self):
        book = OrderBook()
        book.place(Order("sell-1", "sell", 100, 4))
        trades = book.place(Order("buy-1", "buy", 101, 3))
        self.assertEqual([(trade.price, trade.quantity) for trade in trades], [(100, 3)])

    def test_cancel_and_depth(self):
        book = OrderBook()
        book.place(Order("a", "buy", 100, 2))
        book.place(Order("b", "buy", 100, 5))
        self.assertEqual(book.depth("buy"), [(100, 7)])
        self.assertTrue(book.cancel("a"))
        self.assertEqual(book.depth("buy"), [(100, 5)])

    def test_best_price(self):
        book = OrderBook()
        book.place(Order("a", "sell", 105, 1))
        book.place(Order("b", "sell", 101, 1))
        self.assertEqual(book.best_price("sell"), 101)
