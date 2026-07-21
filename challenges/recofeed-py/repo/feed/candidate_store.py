from .models import Item


class CandidateStore:
    def merge_unique(self, sources: list[list[Item]]) -> list[Item] | None:
        return None

    def unseen(self, items: list[Item], seen: list[str]) -> list[Item] | None:
        return None
