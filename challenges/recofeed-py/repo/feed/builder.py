from .models import Item
from .stores import FeedStores


class FeedBuilder:
    def __init__(self, affinity: list[tuple[str, float]]) -> None:
        self.affinity = affinity
        self.refreshes: list[str] = []
        self.stores = FeedStores(affinity)

    def build(self, sources: list[list[Item]], seen: list[str], limit: int = 20) -> list[Item]:
        merged = self.stores.merge_unique(sources)
        if merged is None:
            flattened = [item for source in sources for item in source]
            merged = [item for index, item in enumerate(flattened) if item.item_id not in [other.item_id for other in flattened[:index]]]
        eligible = self.stores.unseen(merged, seen)
        if eligible is None:
            eligible = [item for item in merged if item.item_id not in seen]
        ranked = self.stores.top(eligible, limit, lambda item: item.score * self.weight_for(item.topic))
        if ranked is not None:
            return ranked
        ranked = sorted(eligible, key=lambda item: item.score * self.weight_for(item.topic), reverse=True)
        return ranked[:limit]

    def weight_for(self, topic: str) -> float:
        indexed = self.stores.weight(topic)
        if indexed is not None:
            return indexed
        for name, weight in self.affinity:
            if name == topic:
                return weight
        return 1.0

    def refresh(self, user_id: str) -> bool:
        indexed = self.stores.refreshed(user_id)
        if indexed is not None:
            return indexed
        if user_id in self.refreshes:
            return False
        self.refreshes.append(user_id)
        return True
