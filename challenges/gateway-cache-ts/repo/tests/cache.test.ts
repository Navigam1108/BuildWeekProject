import assert from "node:assert/strict";
import { ResponseCache } from "../src/response-cache.ts";

const cache = new ResponseCache();
cache.set("a", { status: 200, body: "A" });
assert.deepEqual(cache.get("a"), { status: 200, body: "A" });
assert.equal(cache.get("missing"), undefined);
cache.set("a", { status: 201, body: "updated" });
assert.equal(cache.get("a")?.status, 201);
console.log("3 tests passed");
