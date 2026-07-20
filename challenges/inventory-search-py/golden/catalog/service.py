from bisect import bisect_left
from dataclasses import dataclass


@dataclass(frozen=True)
class Product:
    sku: str; name: str; category: str; warehouse: str; stock: int


class CatalogService:
    def __init__(self, products: list[Product]) -> None:
        self.products = products; self._sku = {p.sku: p for p in products}; self._by_category = {}
        self._by_name = sorted(products, key=lambda p: p.name.lower())
        self._names = [p.name.lower() for p in self._by_name]
        for product in products: self._by_category.setdefault(product.category, []).append(product)

    def by_sku(self, sku: str) -> Product | None: return self._sku.get(sku)
    def prefix(self, query: str, limit: int = 20) -> list[Product]:
        start = bisect_left(self._names, query.lower()); return [p for p in self._by_name[start:start + limit] if p.name.lower().startswith(query.lower())]
    def facets(self, category: str) -> dict[str, int]:
        result = {}; [result.__setitem__(p.warehouse, result.get(p.warehouse, 0) + 1) for p in self._by_category.get(category, [])]; return result
    def available(self, skus: list[str], warehouse: str) -> list[Product]: return [p for sku in skus if (p := self._sku.get(sku)) and p.warehouse == warehouse and p.stock > 0]
    def page(self, category: str, offset: int, limit: int) -> list[Product]: return self._by_category.get(category, [])[offset:offset + limit]
