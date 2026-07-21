# API-602: gateway replay saturation

Replay traffic is exposing expensive work in the response cache. The gateway
must keep its bounded cache responsive while expiring stale responses,
canonicalizing request headers, sharing in-flight upstream work, and removing
responses by tag. Preserve the public behavior and use `make test` and
`make bench` to validate each change.

## Investigation scope

The cache facade, extension seams, replay data, and test cases describe the
real contract from different angles. `TODO.md` contains intentionally blank
implementation seams. A focused, measurable subset is preferable to a rewrite.
