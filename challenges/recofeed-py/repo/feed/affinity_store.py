class AffinityStore:
    def __init__(self, affinity: list[tuple[str, float]]) -> None:
        self.affinity = affinity

    def weight(self, topic: str) -> float | None:
        return None

    def top(self, items, limit: int, score_for) -> list | None:
        return None
