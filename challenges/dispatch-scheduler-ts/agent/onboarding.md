# Dispatch — dependency-aware job scheduling

Dispatch is a small JavaScript module that models a job scheduler with
dependency resolution and worker dispatch. The public entry point is the
`Scheduler` class exported from `src/scheduler.mjs`.

- `src/scheduler.mjs` — single-file `Scheduler` class with job lifecycle
  management (add, complete, ready, assign, due-retry scanning).

The repository includes tests under `tests/` and a benchmark under
`benchmarks/`. Run `make test` and `make bench` from the repository root.
