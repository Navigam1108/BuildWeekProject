# API-602: bounded response cache

The gateway process grows continuously during a replay load and eventually
OOMs. Keep the response cache bounded without changing its public `get`/`set`
API. Run `make test` and `make bench` before submitting.
