import { CalendarIndex } from "./calendar-index.mjs"
import { ReadyState } from "./ready-state.mjs"
import { WorkerPool } from "./worker-pool.mjs"

export class DispatchState {
  constructor() {
    this.readyState = new ReadyState()
    this.workers = new WorkerPool()
    this.calendarIndex = new CalendarIndex()
  }

  complete(id) { return this.readyState.complete(id) }
  ready(now) { return this.readyState.ready(now) }
  worker() { return this.workers.worker() }
  retries(now) { return this.calendarIndex.retries(now) }
  calendar(start, end) { return this.calendarIndex.calendar(start, end) }
}
