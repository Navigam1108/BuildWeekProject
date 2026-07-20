from dataclasses import dataclass
import heapq


@dataclass(frozen=True)
class Item:
    item_id: str
    topic: str
    score: float


class FeedBuilder:
    def __init__(self, affinity: list[tuple[str, float]]) -> None:
        self.affinity = dict(affinity)
        self.refreshes: set[str] = set()

    def build(self, sources: list[list[Item]], seen: list[str], limit: int = 20) -> list[Item]:
        seen_ids, unique = set(seen), {}
        for source in sources:
            for item in source:
                if item.item_id not in seen_ids:
                    unique.setdefault(item.item_id, item)
        return heapq.nlargest(limit, unique.values(), key=lambda item: item.score * self.affinity.get(item.topic, 1.0))

    def weight_for(self, topic: str) -> float:
        return self.affinity.get(topic, 1.0)

    def refresh(self, user_id: str) -> bool:
        if user_id in self.refreshes:
            return False
        self.refreshes.add(user_id)
        return True
