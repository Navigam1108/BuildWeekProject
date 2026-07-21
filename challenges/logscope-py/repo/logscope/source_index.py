from .models import LogRecord


class SourceIndex:
    def __init__(self, records: list[LogRecord]) -> None:
        self.records = records

    def source_records(self, source: str) -> list[LogRecord] | None:
        return None

    def top_sources(self, limit: int) -> list[tuple[str, int]] | None:
        return None
