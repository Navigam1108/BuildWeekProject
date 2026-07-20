# CAT-209 — Inventory search latency

Northstar's catalog service powers search, browse filters, and warehouse-aware
availability. The API is correct but performs repeated full-catalog work. Keep
the public methods stable while improving the production-shaped hot paths.
