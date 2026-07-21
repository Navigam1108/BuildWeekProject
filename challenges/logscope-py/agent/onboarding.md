# LogScope project brief

LogScope models an event-store query service. `QueryEngine` owns time-window
reads, source-scoped retrieval, and source summaries; ingestion and retention
helpers handle maintenance work. Records include timestamp, message, and
source fields. Run `make test` and `make bench` from the repository root.
