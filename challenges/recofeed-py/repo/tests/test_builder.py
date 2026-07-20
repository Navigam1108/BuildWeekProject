import unittest

from feed.builder import FeedBuilder, Item


class FeedBuilderTests(unittest.TestCase):
    def test_dedupes_seen_items_and_ranks(self):
        builder = FeedBuilder([("sports", 2.0)])
        result = builder.build([[Item("a", "sports", 2), Item("b", "news", 3)], [Item("a", "sports", 2)]], ["b"])
        self.assertEqual([item.item_id for item in result], ["a"])

    def test_refresh_is_idempotent(self):
        builder = FeedBuilder([])
        self.assertTrue(builder.refresh("u1"))
        self.assertFalse(builder.refresh("u1"))
