from .query_engine import LogRecord


def parse_line(line: str) -> LogRecord:
    timestamp, _, message = line.partition(" ")
    return LogRecord(int(timestamp), message)


def suppress_duplicates(records: list[LogRecord]) -> list[LogRecord]:
    accepted = []
    for record in records:
        if not any((item.timestamp, item.message, item.source) == (record.timestamp, record.message, record.source) for item in accepted):
            accepted.append(record)
    return accepted
