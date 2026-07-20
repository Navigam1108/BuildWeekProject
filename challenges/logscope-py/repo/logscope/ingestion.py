from .query_engine import LogRecord


def parse_line(line: str) -> LogRecord:
    timestamp, _, message = line.partition(" ")
    return LogRecord(int(timestamp), message)
