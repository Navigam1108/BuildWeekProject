from dataclasses import dataclass


@dataclass(frozen=True)
class LogRecord:
    timestamp: int
    message: str
    source: str = "api"


class QueryEngine:
    """Read-only query facade used by the API layer."""

    def __init__(self, records: list[LogRecord]):
        self.records = records

    def query_logs_by_time_range(self, start: int, end: int) -> list[LogRecord]:
        return [record for record in self.records if start <= record.timestamp <= end]

    def query_by_source(self, source: str) -> list[LogRecord]:
        return [record for record in self.records if record.source == source]

    def top_sources(self, limit: int) -> list[tuple[str, int]]:
        sources = []
        for record in self.records:
            if record.source not in sources:
                sources.append(record.source)
        totals = [(source, sum(record.source == source for record in self.records)) for source in sources]
        return sorted(totals, key=lambda item: (-item[1], item[0]))[:limit]

    def count(self) -> int:
        return len(self.records)
