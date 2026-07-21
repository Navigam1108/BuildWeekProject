from .models import Product


class IdentityIndex:
    def __init__(self, products: list[Product]) -> None:
        self.products = products

    def by_sku(self, sku: str) -> Product | None:
        return None

    def available_in(self, skus: list[str], warehouse: str) -> list[Product] | None:
        return None
