import json
import time

from feed.builder import FeedBuilder, Item


BASELINES = {"dedupe": 500.0, "affinity": 150.0, "top-k": 2_000.0, "seen": 300.0, "refresh": 340.0}
GOLDENS = {"dedupe": 1.0, "affinity": 9.0, "top-k": 3.0, "seen": 1.0, "refresh": 2.0}


def elapsed(operation):
    start = time.perf_counter()
    operation()
    return round((time.perf_counter() - start) * 1000, 3)


def dedupe():
    sources = [[Item(f"item-{index % 1_000}", "news", float(index)) for index in range(2_000)] for _ in range(4)]
    return elapsed(lambda: FeedBuilder([]).build(sources, [], 1_000))


def affinity():
    builder = FeedBuilder([(f"topic-{index}", 1.0 + index / 100) for index in range(1_000)])
    sources = [[Item("only", "topic-999", 1.0)]]
    return elapsed(lambda: [builder.build(sources, [], 1) for _ in range(8_000)])


def top_k():
    sources = [[Item(f"item-{index}", "news", float(index % 100)) for index in range(12_000)]]
    return elapsed(lambda: FeedBuilder([]).build(sources, [], 40))


def seen_filter():
    sources = [[Item(f"item-{index}", "news", float(index)) for index in range(4_000)]]
    seen = [f"item-{index}" for index in range(3_500)]
    return elapsed(lambda: FeedBuilder([]).build(sources, seen, 100))


def refresh():
    builder = FeedBuilder([])
    return elapsed(lambda: [builder.refresh(f"user-{index}") for index in range(8_000)])


def checks():
    deduped = FeedBuilder([]).build([[Item("a", "news", 1), Item("a", "news", 2)]], [], 5)
    affinity = FeedBuilder([("sports", 2.0)]).weight_for("sports") == 2.0
    ranked = FeedBuilder([]).build([[Item("low", "news", 1), Item("high", "news", 3)]], [], 1)
    filtered = FeedBuilder([]).build([[Item("seen", "news", 5), Item("fresh", "news", 1)]], ["seen"], 5)
    refresh = FeedBuilder([])
    return {
        "dedupe": len(deduped) == 1 and deduped[0].item_id == "a",
        "affinity": affinity,
        "top-k": [item.item_id for item in ranked] == ["high"],
        "seen": [item.item_id for item in filtered] == ["fresh"],
        "refresh": refresh.refresh("user") and not refresh.refresh("user"),
    }


def main():
    operations = {"dedupe": dedupe, "affinity": affinity, "top-k": top_k, "seen": seen_filter, "refresh": refresh}
    verified = checks()
    missions = []
    for mission_id, operation in operations.items():
        candidate = operation()
        baseline, golden = BASELINES[mission_id], GOLDENS[mission_id]
        # Keep the unoptimized starter at developing; this is intentionally a
        # high bar for evidence that a mission was actually optimized.
        threshold = baseline - max(0, baseline - golden) * 0.75
        missions.append({"id": mission_id, "baseline_ms": baseline, "candidate_ms": candidate, "golden_ms": golden, "passed": verified[mission_id] and candidate <= threshold})
    print(json.dumps({"missions": missions}))


if __name__ == "__main__":
    main()
