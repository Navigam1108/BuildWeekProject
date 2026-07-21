from dataclasses import dataclass


@dataclass(frozen=True)
class Item:
    item_id: str
    topic: str
    score: float
