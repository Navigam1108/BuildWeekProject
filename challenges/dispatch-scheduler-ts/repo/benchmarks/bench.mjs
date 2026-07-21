import { Scheduler } from "../src/scheduler.mjs"
import fs from "node:fs"

const variant = fs.existsSync(new URL("./variant.json", import.meta.url))
  ? JSON.parse(fs.readFileSync(new URL("./variant.json", import.meta.url), "utf8")).fixture
  : { count_multiplier: 1, index_offset: 0, hotspot_mod: 0, burst_repeats: 1 }
const jobCount = Math.round(12_000 * variant.count_multiplier)
const workerCount = Math.round(512 * variant.count_multiplier)

const measure = work => {
  const start = performance.now()
  work()
  return performance.now() - start
}

const jobs = Array.from({ length: jobCount }, (_, index) => ({
  id: `job-${index + variant.index_offset}`,
  dependencies: index % (3 + variant.hotspot_mod) ? [`job-${index - (index % (3 + variant.hotspot_mod)) + variant.index_offset}`] : [],
  priority: index % 31,
  retryAt: index % 4_000,
  running: false,
}))

const scheduler = new Scheduler(jobs)
for (let index = 0; index < workerCount; index += 1) scheduler.register({ id: `worker-${index}`, busy: false, load: index % 7 })

const ready = measure(() => {
  for (let index = 0; index < 2_000 * variant.burst_repeats; index += 1) scheduler.ready(3_999 + variant.index_offset)
})

const release = measure(() => {
  for (let index = 0; index < 4_000 * variant.count_multiplier; index += 3) scheduler.complete(`job-${index + variant.index_offset}`)
  scheduler.ready(3_999)
})

const workers = measure(() => {
  for (let index = 0; index < 120; index += 1) {
    const assignment = scheduler.assign(3_999)
    if (assignment) scheduler.release?.(assignment.workerId)
  }
})

const retries = measure(() => {
  for (let index = 0; index < 2_000; index += 1) scheduler.dueRetries(1_500)
})

const calendar = measure(() => {
  for (let index = 0; index < 2_000; index += 1) scheduler.scheduledBetween(1_000, 1_450)
})

const total = ready + release + workers + retries + calendar
console.log(`ready_ms=${ready.toFixed(2)}`)
console.log(`release_ms=${release.toFixed(2)}`)
console.log(`workers_ms=${workers.toFixed(2)}`)
console.log(`retries_ms=${retries.toFixed(2)}`)
console.log(`calendar_ms=${calendar.toFixed(2)}`)
console.log(`candidate_ms=${total.toFixed(2)}`)
