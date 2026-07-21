import assert from "node:assert/strict"
import { pathToFileURL } from "node:url"
const { Router } = await import(pathToFileURL(process.env.ROUTER_MODULE).href)

const route = { id: "orders", prefix: "/api/orders/", middleware: ["auth"], backends: [{ id: "a", weight: 2 }, { id: "b", weight: 1 }] }
const router = new Router([{ id: "api", prefix: "/api/", middleware: [], backends: [{ id: "fallback", weight: 1 }] }, route], [{ tenant: "acme", routes: ["orders"] }])
assert.equal(router.resolve("/api/orders/1").id, "orders")
assert.deepEqual(router.middleware(route), [{ id: "auth" }])
assert.equal(router.authorized("acme", route), true)
assert.equal(router.authorized("other", route), false)
assert.equal(router.backend(route, 2), "b")
router.cached("/api/orders/1")
router.invalidate("/api/orders/")
assert.equal(router.cached("/api/orders/1").id, "orders")
