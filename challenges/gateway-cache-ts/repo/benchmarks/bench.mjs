import { ResponseCache } from "../src/response-cache.mjs";
const cache = new ResponseCache();
const start = performance.now();
for (let i = 0; i < 20_000; i++) cache.set(`response-${i}`, { status: 200, body: "payload" });
const elapsed = performance.now() - start;
console.log(`candidate_ms=${elapsed.toFixed(2)} candidate_size=${cache.size()}`);
