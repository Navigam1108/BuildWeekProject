from dataclasses import dataclass


@dataclass(frozen=True)
class Item:
    item_id: str
    topic: str
    score: float


class FeedBuilder:
    def __init__(self, affinity: list[tuple[str, float]]) -> None:
        self.affinity = affinity
        self.refreshes: list[str] = []

    def build(self, sources: list[list[Item]], seen: list[str], limit: int = 20) -> list[Item]:
        merged = [item for source in sources for item in source]
        unique = [item for index, item in enumerate(merged) if item.item_id not in [other.item_id for other in merged[:index]]]
        eligible = [item for item in unique if item.item_id not in seen]
        ranked = sorted(eligible, key=lambda item: item.score * self.weight_for(item.topic), reverse=True)
        return ranked[:limit]

    def weight_for(self, topic: str) -> float:
        for name, weight in self.affinity:
            if name == topic:
                return weight
        return 1.0

    def refresh(self, user_id: str) -> bool:
        if user_id in self.refreshes:
            return False
        self.refreshes.append(user_id)
        return True
