from dataclasses import dataclass


@dataclass(frozen=True)
class LogRecord:
    timestamp: int
    message: str


class QueryEngine:
    """Read-only query facade used by the API layer."""

    def __init__(self, records: list[LogRecord]):
        self.records = records

    def query_logs_by_time_range(self, start: int, end: int) -> list[LogRecord]:
        # Deliberately simple implementation for the interview task.
        return [record for record in self.records if start <= record.timestamp <= end]

    def count(self) -> int:
        return len(self.records)
