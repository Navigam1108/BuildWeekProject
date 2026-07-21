import assert from "node:assert/strict";
import { Scheduler } from "../src/scheduler.mjs";
const scheduler = new Scheduler([{ id: "a", dependencies: [], priority: 1, retryAt: 0, running: false }, { id: "b", dependencies: ["a"], priority: 2, retryAt: 0, running: false }]);
scheduler.register({ id: "w", busy: false, load: 0 });
assert.deepEqual(scheduler.assign(0), { jobId: "a", workerId: "w" }); scheduler.complete("a"); scheduler.workers[0].busy = false;
assert.equal(scheduler.ready(0)[0].id, "b");
assert.deepEqual(scheduler.scheduledBetween(0, 0).map(job => job.id), ["a", "b"]);
console.log("ok");
