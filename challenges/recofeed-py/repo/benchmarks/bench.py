import time
from feed.builder import FeedBuilder, Item

sources = [[Item(f"item-{source}-{index % 1800}", "sports" if index % 3 else "news", float(index % 100)) for index in range(1_500)] for source in range(8)]
seen = [f"item-0-{index}" for index in range(900)]
builder = FeedBuilder([("sports", 1.8), ("news", 0.8)])
start = time.perf_counter()
for _ in range(10):
    builder.build(sources, seen, 50)
elapsed = (time.perf_counter() - start) * 1000
print(f"candidate_ms={elapsed:.2f}")
