import { MaxPriorityQueue, MinPriorityQueue } from "./priority-queue.mjs"

const comparePriority = (left, right) => right.priority - left.priority || left.id.localeCompare(right.id)
const compareRetry = (left, right) => left.retryAt - right.retryAt || left.id.localeCompare(right.id)

export class Scheduler {
  constructor(jobs = []) {
    this.jobs = new Map()
    this.dependents = new Map()
    this.remaining = new Map()
    this.workers = []
    this.workersById = new Map()
    this.readyQueue = new MaxPriorityQueue(comparePriority)
    this.workerQueue = new MinPriorityQueue((left, right) => left.load - right.load || left.id.localeCompare(right.id))
    this.retryQueue = new MinPriorityQueue(compareRetry)
    this.retryTimeline = []
    this.readySnapshot = null
    this.dueSnapshotAt = null
    this.dueSnapshot = []
    jobs.forEach(job => this.add(job))
    this.retryTimeline.sort(compareRetry)
  }

  add(job) {
    const copy = { ...job, dependencies: [...job.dependencies] }
    this.jobs.set(copy.id, copy)
    this.remaining.set(copy.id, copy.dependencies.length)
    this.retryQueue.push(copy)
    this.retryTimeline.push(copy)
    copy.dependencies.forEach(id => {
      const children = this.dependents.get(id) || []
      children.push(copy.id)
      this.dependents.set(id, children)
    })
  }

  register(worker) {
    const copy = { ...worker }
    this.workers.push(copy)
    this.workersById.set(copy.id, copy)
    this.workerQueue.push(copy)
  }

  release(workerId) {
    const worker = this.workersById.get(workerId)
    if (worker && worker.busy) {
      worker.busy = false
      this.workerQueue.push(worker)
    }
  }

  complete(id) {
    for (const childId of this.dependents.get(id) || []) {
      const remaining = this.remaining.get(childId) - 1
      this.remaining.set(childId, remaining)
      const child = this.jobs.get(childId)
      if (remaining === 0 && child.due && !child.running) this.enqueueReady(child)
    }
  }

  enqueueReady(job) {
    if (!job.queued) {
      job.queued = true
      this.readyQueue.push(job)
      this.readySnapshot = null
    }
  }

  activateDue(now) {
    while (this.retryQueue.size && this.retryQueue.peek().retryAt <= now) {
      const job = this.retryQueue.pop()
      job.due = true
      if (this.remaining.get(job.id) === 0 && !job.running) this.enqueueReady(job)
    }
  }

  ready(now) {
    this.activateDue(now)
    if (!this.readySnapshot) this.readySnapshot = this.readyQueue.values().sort(comparePriority)
    return this.readySnapshot
  }

  assign(now) {
    this.activateDue(now)
    const job = this.readyQueue.pop()
    if (job) job.queued = false
    let worker
    while (this.workerQueue.size && !worker) {
      const candidate = this.workerQueue.pop()
      if (!candidate.busy) worker = candidate
    }
    if (!job || !worker) {
      if (job) this.enqueueReady(job)
      return null
    }
    job.running = true
    this.dueSnapshotAt = null
    worker.busy = true
    worker.load += 1
    this.readySnapshot = null
    return { jobId: job.id, workerId: worker.id }
  }

  dueRetries(now) {
    if (this.dueSnapshotAt === now) return this.dueSnapshot
    const index = upperBound(this.retryTimeline, now)
    this.dueSnapshotAt = now
    this.dueSnapshot = this.retryTimeline.slice(0, index).filter(job => !job.running)
    return this.dueSnapshot
  }

  scheduledBetween(start, end) {
    const first = lowerBound(this.retryTimeline, start)
    const last = upperBound(this.retryTimeline, end)
    return this.retryTimeline.slice(first, last)
  }
}

function lowerBound(items, value) {
  let left = 0
  let right = items.length
  while (left < right) {
    const middle = left + Math.floor((right - left) / 2)
    if (items[middle].retryAt < value) left = middle + 1
    else right = middle
  }
  return left
}

function upperBound(items, value) {
  let left = 0
  let right = items.length
  while (left < right) {
    const middle = left + Math.floor((right - left) / 2)
    if (items[middle].retryAt <= value) left = middle + 1
    else right = middle
  }
  return left
}
