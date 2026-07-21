# Scheduler implementation seams

`Scheduler` owns its public behavior but consults the empty `DispatchState`
collaborator before running legacy scans. The seams allow a candidate to build
state incrementally without committing to a whole-engine rewrite.

- Keep dependency release correct when one completion unlocks a large fan-out.
- Preserve priority and worker-load tie behavior.
- Reconcile retry and calendar indexes with job mutations.

The interview rewards well-scoped evidence, not implementing every data
structure in this repository.
