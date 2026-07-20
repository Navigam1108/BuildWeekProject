import time
from catalog.service import CatalogService, Product

products = [Product(f"SKU-{i}", f"Widget {i:06}", f"cat-{i % 12}", f"wh-{i % 6}", i % 9) for i in range(30_000)]
service = CatalogService(products)
start = time.perf_counter()
for i in range(600):
    service.by_sku(f"SKU-{i * 17}"); service.prefix("widget 00"); service.facets(f"cat-{i % 12}")
    service.available([f"SKU-{i * 3 + j}" for j in range(30)], f"wh-{i % 6}"); service.page(f"cat-{i % 12}", 500, 25)
elapsed = (time.perf_counter() - start) * 1000
print(f"candidate_ms={elapsed:.2f}")
