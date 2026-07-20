import unittest
from catalog.service import CatalogService, Product


class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.service = CatalogService([Product("A", "Apple", "fruit", "blr", 2), Product("B", "Apricot", "fruit", "mum", 0)])

    def test_lookup_and_prefix(self):
        self.assertEqual(self.service.by_sku("A").name, "Apple")
        self.assertEqual([item.sku for item in self.service.prefix("ap")], ["A", "B"])

    def test_availability(self):
        self.assertEqual([item.sku for item in self.service.available(["A", "B"], "blr")], ["A"])
