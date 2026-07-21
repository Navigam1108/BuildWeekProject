# OPS-761 — Dispatch backlog

Dispatch turns completed workflow nodes into runnable jobs and assigns them to
workers. The current implementation is correct but repeatedly scans the entire
workflow state. Preserve the Scheduler API while improving the hot path.

The hot paths are `ready`, `complete`, `assign`, `dueRetries`, and
`scheduledBetween`. `release(workerId)` is available for callers that return a
worker to the dispatch pool. The benchmark prints one timing for each path.

## Investigation scope

The behavior is spread across the scheduler facade, dispatch-state seam, test
fixtures, and replay benchmark. `TODO.md` identifies deliberately incomplete
extension points. It does not prescribe a solution; preserve dependency and
worker lifecycle semantics while improving whichever paths you can defend.
