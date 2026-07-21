import assert from "node:assert/strict"
import { ResponseCache } from "../src/response-cache.mjs"

const cache = new ResponseCache(2)
cache.set("a", { status: 200, body: "A", tags: ["catalog"] })
assert.deepEqual(cache.get("a"), { status: 200, body: "A", tags: ["catalog"] })
assert.equal(cache.get("missing"), undefined)
cache.set("a", { status: 201, body: "updated" })
assert.equal(cache.get("a")?.status, 201)
cache.set("b", { status: 200, body: "B" })
cache.set("c", { status: 200, body: "C" })
assert.equal(cache.size(), 2)
assert.equal(cache.normalizeHeaders([["X-Trace", " one "], ["x-trace", "two"]]), "x-trace:two")
assert.equal(cache.invalidateTag("catalog"), 0)
console.log("6 tests passed")
