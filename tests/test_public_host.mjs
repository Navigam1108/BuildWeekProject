import assert from "node:assert/strict"

process.env.PUBLIC_HOST = "localhost:3000"

const { publicHostname } = await import("../lib/config.ts")

assert.equal(publicHostname(), "localhost")
console.log("PASS PUBLIC_HOST strips a legacy app port for IDE URLs")
