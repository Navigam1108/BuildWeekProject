# LogScope project brief

LogScope is a small Python package that models a read-only log query service.
The public entry point is `logscope.query_engine.QueryEngine`. Records are
represented by `LogRecord` objects with a numeric timestamp and message.

Supporting modules cover ingestion, retention, compression, and timestamp
parsing. The repository includes a unittest suite under `tests/` and a benchmark
under `benchmarks/`. Run `make test` and `make bench` from the repository root.
