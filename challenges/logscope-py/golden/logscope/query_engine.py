from bisect import bisect_left, bisect_right
from collections import Counter, defaultdict
from dataclasses import dataclass


@dataclass(frozen=True)
class LogRecord:
    timestamp: int
    message: str
    source: str = "api"


class QueryEngine:
    """Reference indexed facade with the same public query contract."""

    def __init__(self, records: list[LogRecord]):
        self.records = sorted(records, key=lambda record: record.timestamp)
        self._timestamps = [record.timestamp for record in self.records]
        self._by_source = defaultdict(list)
        for record in self.records:
            self._by_source[record.source].append(record)
        self._top_sources = sorted(Counter(record.source for record in self.records).items(), key=lambda item: (-item[1], item[0]))

    def query_logs_by_time_range(self, start: int, end: int) -> list[LogRecord]:
        return self.records[bisect_left(self._timestamps, start):bisect_right(self._timestamps, end)]

    def query_by_source(self, source: str) -> list[LogRecord]:
        return list(self._by_source.get(source, []))

    def top_sources(self, limit: int) -> list[tuple[str, int]]:
        return self._top_sources[:limit]

    def count(self) -> int:
        return len(self.records)
