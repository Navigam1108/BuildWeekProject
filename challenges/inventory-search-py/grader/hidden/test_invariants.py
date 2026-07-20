import unittest
from catalog.service import CatalogService, Product
class Invariants(unittest.TestCase):
    def test_missing_sku_is_none(self): self.assertIsNone(CatalogService([]).by_sku("missing"))
