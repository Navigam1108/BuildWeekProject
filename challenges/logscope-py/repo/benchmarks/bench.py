import time

from logscope.ingestion import suppress_duplicates
from logscope.query_engine import LogRecord, QueryEngine
from logscope.retention import expired_record_ids


def timed(callback):
    start = time.perf_counter()
    callback()
    return round((time.perf_counter() - start) * 1000, 2)


records = [LogRecord(index, f"event-{index % 400}", f"service-{index % 120}") for index in range(18_000)]
engine = QueryEngine(records)
duplicate_records = records[:3_000] + records[:3_000]

metrics = {
    "time_range": timed(lambda: [engine.query_logs_by_time_range(10_000 + offset, 10_020 + offset) for offset in range(0, 4_000, 100)]),
    "field_filter": timed(lambda: [engine.query_by_source(f"service-{index % 120}") for index in range(240)]),
    "retention": timed(lambda: expired_record_ids(records, 9_000)),
    "top_sources": timed(lambda: [engine.top_sources(10) for _ in range(20)]),
    "dedupe": timed(lambda: suppress_duplicates(duplicate_records)),
}
print(" ".join(f"{name}_ms={value:.2f}" for name, value in metrics.items()))
