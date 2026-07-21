export class Router {
  constructor(routes = [], policies = []) {
    this.routes = routes
    this.policies = policies
    this.cache = []
  }

  resolve(path) {
    return this.routes.reduce((best, route) => path.startsWith(route.prefix) && (!best || route.prefix.length > best.prefix.length) ? route : best, null)
  }

  middleware(route) {
    return route ? route.middleware.map(id => ({ id })) : []
  }

  authorized(tenant, route) {
    const policy = this.policies.find(item => item.tenant === tenant)
    return Boolean(policy && route && policy.routes.includes(route.id))
  }

  backend(route, ticket = 0) {
    if (!route) return null
    const expanded = route.backends.flatMap(item => Array(item.weight).fill(item))
    return expanded[ticket % expanded.length].id
  }

  cached(path) {
    const hit = this.cache.find(item => item.path === path)
    if (hit) return hit.route
    const route = this.resolve(path)
    this.cache.push({ path, route })
    return route
  }

  invalidate(prefix) {
    this.cache = this.cache.filter(item => !item.path.startsWith(prefix))
  }
}
