import { CompiledCache } from "./compiled-cache.mjs"
import { PolicyStore } from "./policy-store.mjs"
import { ResolutionStore } from "./resolution-store.mjs"

export class RouteStore {
  constructor() {
    this.resolution = new ResolutionStore()
    this.policy = new PolicyStore()
    this.cache = new CompiledCache()
  }

  resolve(path) { return this.resolution.resolve(path) }
  middleware(route) { return this.resolution.middleware(route) }
  authorized(tenant, route) { return this.policy.authorized(tenant, route) }
  backend(route, ticket) { return this.resolution.backend(route, ticket) }
  cached(path) { return this.cache.cached(path) }
  invalidate(prefix) { return this.cache.invalidate(prefix) }
}
