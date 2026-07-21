import assert from "node:assert/strict"
import { pathToFileURL } from "node:url"
const { Scheduler } = await import(pathToFileURL(process.env.SCHEDULER_MODULE).href)

const jobs = [
  { id: "root", dependencies: [], priority: 1, retryAt: 0, running: false },
  { id: "child", dependencies: ["root"], priority: 9, retryAt: 0, running: false },
  { id: "later", dependencies: [], priority: 3, retryAt: 50, running: false },
]
const scheduler = new Scheduler(jobs)
scheduler.register({ id: "slow", busy: false, load: 4 })
scheduler.register({ id: "fast", busy: false, load: 1 })
assert.equal(scheduler.ready(0)[0].id, "root")
assert.deepEqual(scheduler.assign(0), { jobId: "root", workerId: "fast" })
scheduler.complete("root")
assert.equal(scheduler.ready(0)[0].id, "child")
assert.deepEqual(scheduler.dueRetries(0).map(job => job.id).sort(), ["child"])
assert.deepEqual(scheduler.scheduledBetween(1, 60).map(job => job.id), ["later"])
