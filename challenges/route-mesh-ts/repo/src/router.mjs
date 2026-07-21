import { RouteStore } from "./route-store.mjs"

export class Router {
  constructor(routes = [], policies = []) {
    this.routes = routes
    this.policies = policies
    this.cache = []
    this.store = new RouteStore()
  }

  resolve(path) {
    const indexed = this.store.resolve(path)
    if (indexed !== undefined) return indexed
    return this.routes.reduce((best, route) => path.startsWith(route.prefix) && (!best || route.prefix.length > best.prefix.length) ? route : best, null)
  }

  middleware(route) {
    const indexed = this.store.middleware(route)
    if (indexed !== undefined) return indexed
    return route ? route.middleware.map(id => ({ id })) : []
  }

  authorized(tenant, route) {
    const indexed = this.store.authorized(tenant, route)
    if (indexed !== undefined) return indexed
    const policy = this.policies.find(item => item.tenant === tenant)
    return Boolean(policy && route && policy.routes.includes(route.id))
  }

  backend(route, ticket = 0) {
    const indexed = this.store.backend(route, ticket)
    if (indexed !== undefined) return indexed
    if (!route) return null
    const expanded = route.backends.flatMap(item => Array(item.weight).fill(item))
    return expanded[ticket % expanded.length].id
  }

  cached(path) {
    const indexed = this.store.cached(path)
    if (indexed !== undefined) return indexed
    const hit = this.cache.find(item => item.path === path)
    if (hit) return hit.route
    const route = this.resolve(path)
    this.cache.push({ path, route })
    return route
  }

  invalidate(prefix) {
    const indexed = this.store.invalidate(prefix)
    if (indexed !== undefined) return indexed
    this.cache = this.cache.filter(item => !item.path.startsWith(prefix))
  }
}
