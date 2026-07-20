import assert from "node:assert/strict"; import { Scheduler } from process.env.SCHEDULER_MODULE;
const s = new Scheduler([{ id: "a", dependencies: [], priority: 1, retryAt: 0, running: false }, { id: "b", dependencies: ["a"], priority: 1, retryAt: 0, running: false }]); s.complete("a"); assert.equal(s.ready(0).some(x => x.id === "b"), true);
