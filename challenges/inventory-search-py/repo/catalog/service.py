from dataclasses import dataclass


@dataclass(frozen=True)
class Product:
    sku: str
    name: str
    category: str
    warehouse: str
    stock: int


class CatalogService:
    def __init__(self, products: list[Product]) -> None:
        self.products = products

    def by_sku(self, sku: str) -> Product | None:
        return next((product for product in self.products if product.sku == sku), None)

    def prefix(self, query: str, limit: int = 20) -> list[Product]:
        return [product for product in self.products if product.name.lower().startswith(query.lower())][:limit]

    def facets(self, category: str) -> dict[str, int]:
        result: dict[str, int] = {}
        for product in self.products:
            if product.category == category:
                result[product.warehouse] = result.get(product.warehouse, 0) + 1
        return result

    def available(self, skus: list[str], warehouse: str) -> list[Product]:
        return [product for sku in skus for product in self.products if product.sku == sku and product.warehouse == warehouse and product.stock > 0]

    def page(self, category: str, offset: int, limit: int) -> list[Product]:
        return [product for product in self.products if product.category == category][offset:offset + limit]
