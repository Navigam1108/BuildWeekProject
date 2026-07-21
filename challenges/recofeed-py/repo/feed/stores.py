from .models import Item
from .affinity_store import AffinityStore
from .candidate_store import CandidateStore
from .refresh_store import RefreshStore


class FeedStores:
    def __init__(self, affinity: list[tuple[str, float]]) -> None:
        self.candidates = CandidateStore()
        self.affinity = AffinityStore(affinity)
        self.refresh = RefreshStore()

    def merge_unique(self, sources: list[list[Item]]) -> list[Item] | None:
        return self.candidates.merge_unique(sources)

    def unseen(self, items: list[Item], seen: list[str]) -> list[Item] | None:
        return self.candidates.unseen(items, seen)

    def weight(self, topic: str) -> float | None:
        return self.affinity.weight(topic)

    def top(self, items: list[Item], limit: int, score_for) -> list[Item] | None:
        return self.affinity.top(items, limit, score_for)

    def refreshed(self, user_id: str) -> bool | None:
        return self.refresh.refreshed(user_id)
