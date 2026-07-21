import time
import json
from pathlib import Path

from logscope.ingestion import suppress_duplicates
from logscope.query_engine import LogRecord, QueryEngine
from logscope.retention import expired_record_ids


def load_variant():
    try:
        return json.loads(Path(__file__).with_name("variant.json").read_text())
    except FileNotFoundError:
        return {"fixture": {"count_multiplier": 1.0, "index_offset": 0, "hotspot_mod": 0, "burst_repeats": 1}}


variant = load_variant()["fixture"]
scale = variant["count_multiplier"]
offset = variant["index_offset"]
hotspot = variant["hotspot_mod"]
repeats = variant["burst_repeats"]


def timed(callback):
    start = time.perf_counter()
    callback()
    return round((time.perf_counter() - start) * 1000, 2)


records = [LogRecord(index + offset, f"event-{index % (400 + hotspot)}", f"service-{index % (120 + hotspot)}") for index in range(round(18_000 * scale))]
engine = QueryEngine(records)
duplicate_records = records[:round(3_000 * scale)] * repeats

metrics = {
    "time_range": timed(lambda: [engine.query_logs_by_time_range(10_000 + offset + index, 10_020 + offset + index) for index in range(0, round(4_000 * scale), 100)]),
    "field_filter": timed(lambda: [engine.query_by_source(f"service-{index % (120 + hotspot)}") for index in range(round(240 * scale))]),
    "retention": timed(lambda: expired_record_ids(records, 9_000 + offset)),
    "top_sources": timed(lambda: [engine.top_sources(10) for _ in range(20 * repeats)]),
    "dedupe": timed(lambda: suppress_duplicates(duplicate_records)),
}
print(" ".join(f"{name}_ms={value:.2f}" for name, value in metrics.items()))
