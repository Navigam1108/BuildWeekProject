from dataclasses import dataclass


@dataclass(frozen=True)
class LogRecord:
    timestamp: int
    message: str
    source: str = "api"
