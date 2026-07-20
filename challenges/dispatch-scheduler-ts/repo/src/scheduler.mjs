export class Scheduler {
  constructor(jobs = []) { this.jobs = jobs; this.completed = []; this.workers = []; }
  add(job) { this.jobs.push(job); }
  register(worker) { this.workers.push(worker); }
  complete(id) { if (!this.completed.includes(id)) this.completed.push(id); }
  ready(now) { return this.jobs.filter(job => !job.running && job.retryAt <= now && job.dependencies.every(id => this.completed.includes(id))); }
  assign(now) {
    const job = this.ready(now).sort((a, b) => b.priority - a.priority)[0];
    const worker = this.workers.filter(item => !item.busy).sort((a, b) => a.load - b.load)[0];
    if (!job || !worker) return null; job.running = true; worker.busy = true; worker.load += 1; return { jobId: job.id, workerId: worker.id };
  }
  dueRetries(now) { return this.jobs.filter(job => job.retryAt <= now && !job.running); }
}
