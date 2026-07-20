export class Scheduler {
  constructor(jobs = []) { this.jobs = new Map(); this.dependents = new Map(); this.remaining = new Map(); this.readyJobs = []; this.workers = []; jobs.forEach(job => this.add(job)); }
  add(job) { const copy = { ...job }; this.jobs.set(copy.id, copy); this.remaining.set(copy.id, copy.dependencies.length); copy.dependencies.forEach(id => { const values = this.dependents.get(id) || []; values.push(copy.id); this.dependents.set(id, values); }); if (!copy.dependencies.length) this.readyJobs.push(copy.id); }
  register(worker) { this.workers.push(worker); }
  complete(id) { for (const child of this.dependents.get(id) || []) { const next = this.remaining.get(child) - 1; this.remaining.set(child, next); if (!next) this.readyJobs.push(child); } }
  ready(now) { return this.readyJobs.map(id => this.jobs.get(id)).filter(job => !job.running && job.retryAt <= now).sort((a, b) => b.priority - a.priority); }
  assign(now) { const job = this.ready(now)[0], worker = this.workers.filter(item => !item.busy).sort((a, b) => a.load - b.load)[0]; if (!job || !worker) return null; job.running = true; worker.busy = true; worker.load++; return { jobId: job.id, workerId: worker.id }; }
  dueRetries(now) { return this.ready(now); }
}
