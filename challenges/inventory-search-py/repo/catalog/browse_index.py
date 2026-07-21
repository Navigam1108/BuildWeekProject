from .models import Product


class BrowseIndex:
    def __init__(self, products: list[Product]) -> None:
        self.products = products

    def by_prefix(self, query: str, limit: int) -> list[Product] | None:
        return None

    def facet_counts(self, category: str) -> dict[str, int] | None:
        return None

    def category_page(self, category: str, offset: int, limit: int) -> list[Product] | None:
        return None
