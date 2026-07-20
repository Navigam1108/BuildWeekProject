import assert from "node:assert/strict"; import { Router } from process.env.ROUTER_MODULE;
const r = new Router([{ id: "x", prefix: "/x", middleware: [], backends: [{ id: "a", weight: 1 }] }], [{ tenant: "t", routes: ["x"] }]); assert.equal(r.authorized("t", r.resolve("/x/1")), true);
