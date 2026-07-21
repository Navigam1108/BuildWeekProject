import { ResponseCache } from "../src/response-cache.mjs"
import fs from "node:fs"

const variant = fs.existsSync(new URL("./variant.json", import.meta.url))
  ? JSON.parse(fs.readFileSync(new URL("./variant.json", import.meta.url), "utf8")).fixture
  : { count_multiplier: 1, index_offset: 0, hotspot_mod: 0, burst_repeats: 1 }
const replayCount = Math.round(10_000 * variant.count_multiplier)
const burstRepeats = variant.burst_repeats

function timed(callback) { const start = performance.now(); callback(); return Number((performance.now() - start).toFixed(2)) }
const cache = new ResponseCache()
const boundedMs = timed(() => { for (let index = 0; index < replayCount; index++) cache.set(`response-${index + variant.index_offset}`, { status: 200, body: "payload" }) })
const expiring = new ResponseCache(20_000)
for (let index = 0; index < replayCount; index++) expiring.set(`expired-${index}`, { status: 200, body: "x", ttlMs: -1 })
const expiryMs = timed(() => expiring.purgeExpired())
const headers = Array.from({ length: 600 + variant.hotspot_mod }, (_, index) => [`X-Header-${index}`, `${index}`])
const headersMs = timed(() => { for (let index = 0; index < 20 * burstRepeats; index++) cache.normalizeHeaders(headers) })
let upstreamCalls = 0
const coalescingStart = performance.now()
await Promise.all(Array.from({ length: 30 * burstRepeats }, () => cache.coalesce("/v1/catalog", async () => { upstreamCalls++; return { status: 200, body: "ok" } })))
const coalescingMs = Number((performance.now() - coalescingStart).toFixed(2))
const tagged = new ResponseCache(20_000)
for (let index = 0; index < replayCount; index++) tagged.set(`tagged-${index}`, { status: 200, body: "x", tags: [`team-${index % (100 + variant.hotspot_mod)}`, "catalog"] })
const invalidationMs = timed(() => tagged.invalidateTag("team-42"))
console.log(`bounded_ms=${boundedMs.toFixed(2)} bounded_size=${cache.size()} expiry_ms=${expiryMs.toFixed(2)} headers_ms=${headersMs.toFixed(2)} coalescing_ms=${coalescingMs.toFixed(2)} upstream_calls=${upstreamCalls} invalidation_ms=${invalidationMs.toFixed(2)}`)
