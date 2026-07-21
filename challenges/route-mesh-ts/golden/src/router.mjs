class RouteNode {
  constructor() {
    this.children = new Map()
    this.route = null
  }
}

export class Router {
  constructor(routes = [], policies = []) {
    this.routes = routes
    this.root = new RouteNode()
    this.policyRoutes = new Map(policies.map(policy => [policy.tenant, new Set(policy.routes)]))
    this.middlewareChains = new Map()
    this.backendRanges = new Map()
    this.cache = new Map()
    this.cacheKeysByPrefix = new Map()
    routes.forEach(route => this.addRoute(route))
  }

  addRoute(route) {
    let node = this.root
    for (const character of route.prefix) {
      if (!node.children.has(character)) node.children.set(character, new RouteNode())
      node = node.children.get(character)
    }
    node.route = route
  }

  resolve(path) {
    let node = this.root
    let match = null
    for (const character of path) {
      node = node.children.get(character)
      if (!node) break
      if (node.route) match = node.route
    }
    return match
  }

  middleware(route) {
    if (!route) return []
    if (!this.middlewareChains.has(route.id)) this.middlewareChains.set(route.id, route.middleware.map(id => ({ id })))
    return this.middlewareChains.get(route.id)
  }

  authorized(tenant, route) {
    return Boolean(route && this.policyRoutes.get(tenant)?.has(route.id))
  }

  backend(route, ticket = 0) {
    if (!route) return null
    if (!this.backendRanges.has(route.id)) {
      let total = 0
      const ranges = route.backends.map(backend => {
        total += backend.weight
        return { id: backend.id, upper: total }
      })
      this.backendRanges.set(route.id, { ranges, total })
    }
    const { ranges, total } = this.backendRanges.get(route.id)
    const point = ticket % total
    let left = 0
    let right = ranges.length - 1
    while (left < right) {
      const middle = left + Math.floor((right - left) / 2)
      if (point < ranges[middle].upper) right = middle
      else left = middle + 1
    }
    return ranges[left].id
  }

  cached(path) {
    if (this.cache.has(path)) return this.cache.get(path)
    const route = this.resolve(path)
    this.cache.set(path, route)
    if (route) {
      const keys = this.cacheKeysByPrefix.get(route.prefix) || new Set()
      keys.add(path)
      this.cacheKeysByPrefix.set(route.prefix, keys)
    }
    return route
  }

  invalidate(prefix) {
    for (const path of this.cacheKeysByPrefix.get(prefix) || []) this.cache.delete(path)
    this.cacheKeysByPrefix.delete(prefix)
  }
}
