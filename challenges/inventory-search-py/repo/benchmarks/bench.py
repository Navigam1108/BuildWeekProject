import time
import json
from pathlib import Path
from catalog.service import CatalogService, Product


try:
    variant = json.loads(Path(__file__).with_name("variant.json").read_text())["fixture"]
except FileNotFoundError:
    variant = {"count_multiplier": 1.0, "index_offset": 0, "hotspot_mod": 0, "burst_repeats": 1}

product_count = round(30_000 * variant["count_multiplier"])
operation_count = round(600 * variant["count_multiplier"])
burst_repeats = variant["burst_repeats"]

products = [Product(f"SKU-{i + variant['index_offset']}", f"Widget {i:06}", f"cat-{i % (12 + variant['hotspot_mod'])}", f"wh-{i % 6}", i % 9) for i in range(product_count)]
service = CatalogService(products)
start = time.perf_counter()
for repeat in range(burst_repeats):
    for i in range(operation_count):
        request_index = i + repeat * operation_count
        service.by_sku(f"SKU-{request_index * 17 + variant['index_offset']}"); service.prefix("widget 00"); service.facets(f"cat-{request_index % (12 + variant['hotspot_mod'])}")
        service.available([f"SKU-{request_index * 3 + j + variant['index_offset']}" for j in range(30)], f"wh-{request_index % 6}"); service.page(f"cat-{request_index % (12 + variant['hotspot_mod'])}", 500, 25)
elapsed = (time.perf_counter() - start) * 1000
print(f"candidate_ms={elapsed:.2f}")
