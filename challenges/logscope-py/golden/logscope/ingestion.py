from .query_engine import LogRecord


def parse_line(line: str) -> LogRecord:
    timestamp, _, message = line.partition(" ")
    return LogRecord(int(timestamp), message)


def suppress_duplicates(records: list[LogRecord]) -> list[LogRecord]:
    seen = set()
    accepted = []
    for record in records:
        key = (record.timestamp, record.message, record.source)
        if key not in seen:
            seen.add(key)
            accepted.append(record)
    return accepted
