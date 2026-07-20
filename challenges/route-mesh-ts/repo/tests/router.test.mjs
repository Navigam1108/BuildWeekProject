import assert from "node:assert/strict"; import { Router } from "../src/router.mjs";
const router = new Router([{ id: "orders", prefix: "/orders", middleware: ["auth"], backends: [{ id: "a", weight: 2 }, { id: "b", weight: 1 }] }], [{ tenant: "acme", routes: ["orders"] }]);
assert.equal(router.resolve("/orders/1").id, "orders"); assert.equal(router.authorized("acme", router.resolve("/orders")), true); assert.equal(router.backend(router.resolve("/orders"), 2), "b"); console.log("ok");
