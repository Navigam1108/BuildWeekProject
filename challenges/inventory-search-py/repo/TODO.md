# Catalog service implementation seams

The public `CatalogService` contract is stable. The service currently falls
back to linear scans whenever `CatalogIndexes` returns `None`.

- Build a product-identity lookup without breaking missing-SKU semantics.
- Design a browse index that preserves the existing case-insensitive order.
- Decide how category/warehouse counts and availability can be updated or
  invalidated safely.

You are not expected to complete every seam. Use the benchmark to choose the
two or three changes with the best impact.
