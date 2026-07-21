import time
import json
from pathlib import Path
from feed.builder import FeedBuilder, Item


try:
    variant = json.loads(Path(__file__).with_name("variant.json").read_text())["fixture"]
except FileNotFoundError:
    variant = {"count_multiplier": 1.0, "index_offset": 0, "hotspot_mod": 0, "burst_repeats": 1}

item_count = round(1_500 * variant["count_multiplier"])
seen_count = round(900 * variant["count_multiplier"])

sources = [[Item(f"item-{source}-{(index + variant['index_offset']) % 1800}", "sports" if index % (3 + variant["hotspot_mod"]) else "news", float(index % 100)) for index in range(item_count)] for source in range(8)]
seen = [f"item-0-{index}" for index in range(seen_count)]
builder = FeedBuilder([("sports", 1.8), ("news", 0.8)])
start = time.perf_counter()
for _ in range(10 * variant["burst_repeats"]):
    builder.build(sources, seen, 50)
elapsed = (time.perf_counter() - start) * 1000
print(f"candidate_ms={elapsed:.2f}")
