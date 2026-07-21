import assert from "node:assert/strict"
import { pathToFileURL } from "node:url"
const { ResponseCache } = await import(pathToFileURL(process.env.CACHE_MODULE).href)

const cache = new ResponseCache(2)
cache.set("old", { status: 200, body: "old" })
cache.set("hot", { status: 200, body: "hot" })
cache.get("old")
cache.set("new", { status: 200, body: "new" })
assert.equal(cache.get("hot"), undefined)
assert.equal(cache.size(), 2)

const tagged = new ResponseCache()
tagged.set("a", { status: 200, body: "a", tags: ["customer-1"] })
tagged.set("b", { status: 200, body: "b", tags: ["customer-1", "catalog"] })
assert.equal(tagged.invalidateTag("customer-1"), 2)
assert.equal(tagged.size(), 0)

let calls = 0
await Promise.all(Array.from({ length: 5 }, () => tagged.coalesce("same", async () => { calls++; return { status: 200, body: "ok" } })))
assert.equal(calls, 1)
