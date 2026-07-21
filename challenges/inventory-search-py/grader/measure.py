import json
import time

from catalog.service import CatalogService, Product


BASELINES = {"sku": 750.0, "prefix": 1800.0, "facets": 600.0, "availability": 10_000.0, "pagination": 850.0}
GOLDENS = {"sku": 2.0, "prefix": 3.0, "facets": 4.0, "availability": 2.0, "pagination": 4.0}


def elapsed(operation):
    start = time.perf_counter()
    operation()
    return round((time.perf_counter() - start) * 1000, 3)


def catalog():
    products = [Product(f"SKU-{index:05}", f"Widget {index:05}", f"cat-{index % 12}", f"wh-{index % 6}", index % 9) for index in range(30_000)]
    return CatalogService(products)


def sku_lookup():
    service = catalog()
    return elapsed(lambda: [service.by_sku(f"SKU-{index * 13 % 30_000:05}") for index in range(3_000)])


def prefix_browse():
    service = catalog()
    return elapsed(lambda: [service.prefix(f"widget {index % 100:02}") for index in range(400)])


def facet_counts():
    service = catalog()
    return elapsed(lambda: [service.facets(f"cat-{index % 12}") for index in range(500)])


def availability_join():
    service = catalog()
    groups = [[f"SKU-{(start + offset) % 30_000:05}" for offset in range(120)] for start in range(0, 20_000, 200)]
    return elapsed(lambda: [service.available(skus, f"wh-{index % 6}") for index, skus in enumerate(groups)])


def pagination():
    service = catalog()
    return elapsed(lambda: [service.page(f"cat-{index % 12}", 1_500, 25) for index in range(1_000)])


def checks():
    service = CatalogService([
        Product("A", "Apple", "fruit", "blr", 2),
        Product("B", "Apricot", "fruit", "mum", 0),
        Product("C", "Banana", "fruit", "blr", 4),
    ])
    return {
        "sku": service.by_sku("A") is not None and service.by_sku("missing") is None,
        "prefix": [item.sku for item in service.prefix("ap")] == ["A", "B"],
        "facets": service.facets("fruit") == {"blr": 2, "mum": 1},
        "availability": [item.sku for item in service.available(["A", "B", "C"], "blr")] == ["A", "C"],
        "pagination": [item.sku for item in service.page("fruit", 1, 1)] == ["B"],
    }


def main():
    operations = {"sku": sku_lookup, "prefix": prefix_browse, "facets": facet_counts, "availability": availability_join, "pagination": pagination}
    verified = checks()
    missions = []
    for mission_id, operation in operations.items():
        candidate = operation()
        baseline, golden = BASELINES[mission_id], GOLDENS[mission_id]
        # Keep the unoptimized starter at developing; this is intentionally a
        # high bar for evidence that a mission was actually optimized.
        threshold = baseline - max(0, baseline - golden) * 0.75
        missions.append({"id": mission_id, "baseline_ms": baseline, "candidate_ms": candidate, "golden_ms": golden, "passed": verified[mission_id] and candidate <= threshold})
    print(json.dumps({"missions": missions}))


if __name__ == "__main__":
    main()
