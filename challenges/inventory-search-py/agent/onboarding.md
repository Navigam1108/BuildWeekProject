# Northstar Catalog — inventory search

Northstar Catalog is a small Python package that provides product lookup and
browse operations over a multi-warehouse inventory. The public entry point is
`catalog.CatalogService`. Products are represented by `Product` dataclass
records with sku, name, category, warehouse, and stock fields.

- `catalog/service.py` — core `CatalogService` class with SKU lookup, prefix
  browsing, facet counting, warehouse availability join, and pagination.
- `catalog/__init__.py` — re-exports `CatalogService`, `Product`.

The repository includes a unittest suite under `tests/` and a benchmark under
`benchmarks/`. Run `make test` and `make bench` from the repository root.
