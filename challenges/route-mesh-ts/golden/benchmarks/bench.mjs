import { Router } from "../src/router.mjs"

const measure = work => {
  const start = performance.now()
  work()
  return performance.now() - start
}

const routes = Array.from({ length: 12_000 }, (_, index) => ({
  id: `route-${index}`,
  prefix: `/svc/${index}/`,
  middleware: Array.from({ length: 48 }, (_, middlewareIndex) => `middleware-${middlewareIndex}`),
  backends: Array.from({ length: 64 }, (_, backendIndex) => ({ id: `backend-${backendIndex}`, weight: backendIndex + 1 })),
}))
const policies = Array.from({ length: 8_000 }, (_, index) => ({ tenant: `tenant-${index}`, routes: routes.slice(index % 500, index % 500 + 400).map(route => route.id) }))
const router = new Router(routes, policies)
const selected = routes[4_321]

const routesTime = measure(() => { for (let index = 0; index < 4_000; index += 1) router.resolve(`/svc/${index % routes.length}/orders`) })
const middleware = measure(() => { for (let index = 0; index < 20_000; index += 1) router.middleware(selected) })
const weighted = measure(() => { for (let index = 0; index < 12_000; index += 1) router.backend(selected, index) })
const policy = measure(() => { for (let index = 0; index < 5_000; index += 1) router.authorized(`tenant-${index % policies.length}`, routes[(index % 400) + (index % 500)]) })
const cache = measure(() => { for (let index = 0; index < 4_000; index += 1) router.cached(`/svc/${index}/orders`); for (let index = 0; index < 16_000; index += 1) router.cached(`/svc/${index % 4_000}/orders`); router.invalidate("/svc/200/"); router.cached("/svc/200/orders") })
const total = routesTime + middleware + weighted + policy + cache
console.log(`routes_ms=${routesTime.toFixed(2)}`)
console.log(`middleware_ms=${middleware.toFixed(2)}`)
console.log(`weighted_ms=${weighted.toFixed(2)}`)
console.log(`policy_ms=${policy.toFixed(2)}`)
console.log(`cache_ms=${cache.toFixed(2)}`)
console.log(`candidate_ms=${total.toFixed(2)}`)
