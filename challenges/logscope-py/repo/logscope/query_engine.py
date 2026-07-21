from .models import LogRecord
from .query_hints import QueryHints


class QueryEngine:
    """Read-only query facade used by the API layer."""

    def __init__(self, records: list[LogRecord]):
        self.records = records
        self.hints = QueryHints(records)

    def query_logs_by_time_range(self, start: int, end: int) -> list[LogRecord]:
        indexed = self.hints.range_records(start, end)
        if indexed is not None:
            return indexed
        return [record for record in self.records if start <= record.timestamp <= end]

    def query_by_source(self, source: str) -> list[LogRecord]:
        indexed = self.hints.source_records(source)
        if indexed is not None:
            return indexed
        return [record for record in self.records if record.source == source]

    def top_sources(self, limit: int) -> list[tuple[str, int]]:
        indexed = self.hints.top_sources(limit)
        if indexed is not None:
            return indexed
        sources = []
        for record in self.records:
            if record.source not in sources:
                sources.append(record.source)
        totals = [(source, sum(record.source == source for record in self.records)) for source in sources]
        return sorted(totals, key=lambda item: (-item[1], item[0]))[:limit]

    def count(self) -> int:
        return len(self.records)
