import assert from "node:assert/strict";
const { ResponseCache } = await import(process.env.CACHE_MODULE);
const cache = new ResponseCache();
for (let i = 0; i < 20_000; i++) cache.set(`key-${i}`, { status: 200, body: "x" });
assert.ok(cache.size() <= 5_000, `cache grew to ${cache.size()}`);
