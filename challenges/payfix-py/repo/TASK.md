# FIN-918: reconciliation close is missing its window

The nightly payment close is running late as volume grows. The runbook calls
out ledger matching, duplicate-reference reporting, currency enrichment,
account validation, and the exception queue as the most expensive stages.
Preserve the current behavior and output ordering while making practical
improvements where they have the greatest operational impact.

Run `make test` and `make bench` before submitting.

## Investigation scope

The batch facade and reconciliation-index seam intentionally separate business
semantics from performance work. Review `TODO.md`, fixtures, and benchmarks;
keep output order stable and focus on the stages you can validate.
