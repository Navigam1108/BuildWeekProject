from .models import Product
from .browse_index import BrowseIndex
from .identity_index import IdentityIndex


class CatalogIndexes:
    def __init__(self, products: list[Product]) -> None:
        self.products = products
        self.identity = IdentityIndex(products)
        self.browse = BrowseIndex(products)

    def by_sku(self, sku: str) -> Product | None:
        return self.identity.by_sku(sku)

    def by_prefix(self, query: str, limit: int) -> list[Product] | None:
        return self.browse.by_prefix(query, limit)

    def facet_counts(self, category: str) -> dict[str, int] | None:
        return self.browse.facet_counts(category)

    def available_in(self, skus: list[str], warehouse: str) -> list[Product] | None:
        return self.identity.available_in(skus, warehouse)

    def category_page(self, category: str, offset: int, limit: int) -> list[Product] | None:
        return self.browse.category_page(category, offset, limit)
