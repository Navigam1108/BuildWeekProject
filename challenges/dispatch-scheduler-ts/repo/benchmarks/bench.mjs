import { Scheduler } from "../src/scheduler.mjs";
const jobs = Array.from({ length: 12_000 }, (_, i) => ({ id: `j-${i}`, dependencies: i % 3 ? [`j-${i - i % 3}`] : [], priority: i % 10, retryAt: 0, running: false }));
const scheduler = new Scheduler(jobs); for (let i = 0; i < 80; i++) scheduler.register({ id: `w-${i}`, busy: false, load: 0 });
const start = performance.now(); for (let i = 0; i < 15_000; i++) { scheduler.ready(0); scheduler.dueRetries(0); } console.log(`candidate_ms=${(performance.now() - start).toFixed(2)}`);
