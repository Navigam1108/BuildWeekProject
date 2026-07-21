from .indexes import CatalogIndexes
from .models import Product


class CatalogService:
    def __init__(self, products: list[Product]) -> None:
        self.products = products
        self.indexes = CatalogIndexes(products)

    def by_sku(self, sku: str) -> Product | None:
        indexed = self.indexes.by_sku(sku)
        if indexed is not None:
            return indexed
        return next((product for product in self.products if product.sku == sku), None)

    def prefix(self, query: str, limit: int = 20) -> list[Product]:
        indexed = self.indexes.by_prefix(query, limit)
        if indexed is not None:
            return indexed
        return [product for product in self.products if product.name.lower().startswith(query.lower())][:limit]

    def facets(self, category: str) -> dict[str, int]:
        indexed = self.indexes.facet_counts(category)
        if indexed is not None:
            return indexed
        result: dict[str, int] = {}
        for product in self.products:
            if product.category == category:
                result[product.warehouse] = result.get(product.warehouse, 0) + 1
        return result

    def available(self, skus: list[str], warehouse: str) -> list[Product]:
        indexed = self.indexes.available_in(skus, warehouse)
        if indexed is not None:
            return indexed
        return [product for sku in skus for product in self.products if product.sku == sku and product.warehouse == warehouse and product.stock > 0]

    def page(self, category: str, offset: int, limit: int) -> list[Product]:
        indexed = self.indexes.category_page(category, offset, limit)
        if indexed is not None:
            return indexed
        return [product for product in self.products if product.category == category][offset:offset + limit]
