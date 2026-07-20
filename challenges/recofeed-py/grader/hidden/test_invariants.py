import unittest
from feed.builder import FeedBuilder, Item


class Invariants(unittest.TestCase):
    def test_seen_item_never_returns(self):
        result = FeedBuilder([]).build([[Item("seen", "x", 99)]], ["seen"])
        self.assertEqual(result, [])
