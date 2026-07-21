import { DispatchState } from "./dispatch-state.mjs"

export class Scheduler {
  constructor(jobs = []) {
    this.jobs = jobs
    this.completed = []
    this.workers = []
    this.state = new DispatchState()
  }

  add(job) {
    this.jobs.push(job)
  }

  register(worker) {
    this.workers.push(worker)
  }

  release(workerId) {
    const worker = this.workers.find(item => item.id === workerId)
    if (worker) worker.busy = false
  }

  complete(id) {
    const indexed = this.state.complete(id)
    if (indexed !== undefined) return indexed
    if (!this.completed.includes(id)) this.completed.push(id)
  }

  ready(now) {
    const indexed = this.state.ready(now)
    if (indexed !== undefined) return indexed
    return this.jobs
      .filter(job => !job.running && job.retryAt <= now && job.dependencies.every(id => this.completed.includes(id)))
      .sort((a, b) => b.priority - a.priority)
  }

  assign(now) {
    const job = this.ready(now)[0]
    const indexed = this.state.worker()
    const worker = indexed === undefined ? this.workers.filter(item => !item.busy).sort((a, b) => a.load - b.load)[0] : indexed
    if (!job || !worker) return null
    job.running = true
    worker.busy = true
    worker.load += 1
    return { jobId: job.id, workerId: worker.id }
  }

  dueRetries(now) {
    const indexed = this.state.retries(now)
    if (indexed !== undefined) return indexed
    return this.jobs.filter(job => job.retryAt <= now && !job.running)
  }

  scheduledBetween(start, end) {
    const indexed = this.state.calendar(start, end)
    if (indexed !== undefined) return indexed
    return this.jobs.filter(job => job.retryAt >= start && job.retryAt <= end)
  }
}
