# API-602: gateway replay saturation

Replay traffic is exposing expensive work in the response cache. The gateway
must keep its bounded cache responsive while expiring stale responses,
canonicalizing request headers, sharing in-flight upstream work, and removing
responses by tag. Preserve the public behavior and use `make test` and
`make bench` to validate each change.
