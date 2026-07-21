from .models import LogRecord
from .source_index import SourceIndex
from .time_index import TimeIndex


class QueryHints:
    def __init__(self, records: list[LogRecord]) -> None:
        self.time = TimeIndex(records)
        self.source = SourceIndex(records)

    def range_records(self, start: int, end: int) -> list[LogRecord] | None:
        return self.time.range_records(start, end)

    def source_records(self, source: str) -> list[LogRecord] | None:
        return self.source.source_records(source)

    def top_sources(self, limit: int) -> list[tuple[str, int]] | None:
        return self.source.top_sources(limit)
