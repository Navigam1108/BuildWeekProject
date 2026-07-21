from .models import LogRecord


class TimeIndex:
    def __init__(self, records: list[LogRecord]) -> None:
        self.records = records

    def range_records(self, start: int, end: int) -> list[LogRecord] | None:
        return None
