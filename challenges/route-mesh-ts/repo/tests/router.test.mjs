import assert from "node:assert/strict"; import { Router } from "../src/router.mjs";
const routes = [{ id: "api", prefix: "/api/", middleware: ["trace"], backends: [{ id: "a", weight: 2 }, { id: "b", weight: 1 }] }, { id: "orders", prefix: "/api/orders/", middleware: ["auth"], backends: [{ id: "a", weight: 2 }, { id: "b", weight: 1 }] }]
const router = new Router(routes, [{ tenant: "acme", routes: ["orders"] }])
assert.equal(router.resolve("/api/orders/1").id, "orders")
assert.equal(router.authorized("acme", router.resolve("/api/orders/")), true)
assert.equal(router.backend(router.resolve("/api/orders/"), 2), "b")
assert.equal(router.middleware(routes[1])[0].id, "auth")
router.cached("/api/orders/1")
router.invalidate("/api/orders/")
assert.equal(router.cache instanceof Map ? router.cache.has("/api/orders/1") : router.cache.length > 0, false)
console.log("ok")
