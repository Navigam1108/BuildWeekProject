# OPS-761 — Dispatch backlog

Dispatch turns completed workflow nodes into runnable jobs and assigns them to
workers. The current implementation is correct but repeatedly scans the entire
workflow state. Preserve the Scheduler API while improving the hot path.
