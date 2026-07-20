from bisect import bisect_left, bisect_right
from dataclasses import dataclass


@dataclass(frozen=True)
class LogRecord:
    timestamp: int
    message: str


class QueryEngine:
    """Reference indexed facade with the same public query contract."""

    def __init__(self, records: list[LogRecord]):
        self.records = records
        self._timestamps = [record.timestamp for record in records]

    def query_logs_by_time_range(self, start: int, end: int) -> list[LogRecord]:
        left = bisect_left(self._timestamps, start)
        right = bisect_right(self._timestamps, end)
        return self.records[left:right]
