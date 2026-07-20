import time

from logscope.query_engine import LogRecord, QueryEngine


records = [LogRecord(i, "event") for i in range(1_000_000)]
engine = QueryEngine(records)
start = time.perf_counter()
result = []
for offset in range(0, 300_000, 10_000):
    result = engine.query_logs_by_time_range(600_000 + offset, 600_200 + offset)
elapsed = (time.perf_counter() - start) * 1000
print(f"candidate_ms={elapsed:.2f} result_count={len(result)}")
