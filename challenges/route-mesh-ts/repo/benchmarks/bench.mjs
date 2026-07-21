import { Router } from "../src/router.mjs"
import fs from "node:fs"

const variant = fs.existsSync(new URL("./variant.json", import.meta.url))
  ? JSON.parse(fs.readFileSync(new URL("./variant.json", import.meta.url), "utf8")).fixture
  : { count_multiplier: 1, index_offset: 0, hotspot_mod: 0, burst_repeats: 1 }
const routeCount = Math.round(12_000 * variant.count_multiplier)
const burstRepeats = variant.burst_repeats
const middlewareCount = 48 + variant.hotspot_mod
const backendCount = 64 + variant.hotspot_mod
const policyWindow = 400 + variant.hotspot_mod

const measure = work => {
  const start = performance.now()
  work()
  return performance.now() - start
}

const routes = Array.from({ length: routeCount }, (_, index) => ({
  id: `route-${index + variant.index_offset}`,
  prefix: `/svc/${index + variant.index_offset}/`,
  middleware: Array.from({ length: middlewareCount }, (_, middlewareIndex) => `middleware-${middlewareIndex}`),
  backends: Array.from({ length: backendCount }, (_, backendIndex) => ({ id: `backend-${backendIndex}`, weight: backendIndex + 1 })),
}))
const policies = Array.from({ length: Math.round(8_000 * variant.count_multiplier) }, (_, index) => ({ tenant: `tenant-${index}`, routes: routes.slice(index % 500, index % 500 + policyWindow).map(route => route.id) }))
const router = new Router(routes, policies)
const selected = routes[(4_321 + variant.index_offset) % routes.length]

const routesTime = measure(() => {
  for (let index = 0; index < 4_000 * burstRepeats; index += 1) router.resolve(`/svc/${(index % routes.length) + variant.index_offset}/orders`)
})

const middleware = measure(() => {
  for (let index = 0; index < 20_000 * burstRepeats; index += 1) router.middleware(selected)
})

const weighted = measure(() => {
  for (let index = 0; index < 12_000 * burstRepeats; index += 1) router.backend(selected, index)
})

const policy = measure(() => {
  for (let index = 0; index < 5_000 * burstRepeats; index += 1) router.authorized(`tenant-${index % policies.length}`, routes[(index % policyWindow) + (index % 500)])
})

const cache = measure(() => {
  for (let index = 0; index < 4_000 * burstRepeats; index += 1) router.cached(`/svc/${(index % routeCount) + variant.index_offset}/orders`)
  for (let index = 0; index < 16_000 * burstRepeats; index += 1) router.cached(`/svc/${(index % 4_000) + variant.index_offset}/orders`)
  router.invalidate(`/svc/${200 + variant.index_offset}/`)
  router.cached(`/svc/${200 + variant.index_offset}/orders`)
})

const total = routesTime + middleware + weighted + policy + cache
console.log(`routes_ms=${routesTime.toFixed(2)}`)
console.log(`middleware_ms=${middleware.toFixed(2)}`)
console.log(`weighted_ms=${weighted.toFixed(2)}`)
console.log(`policy_ms=${policy.toFixed(2)}`)
console.log(`cache_ms=${cache.toFixed(2)}`)
console.log(`candidate_ms=${total.toFixed(2)}`)
