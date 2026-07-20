export class Router {
  constructor(routes = [], policies = []) { this.routes = routes; this.byPrefix = new Map(routes.map(route => [route.prefix, route])); this.policies = new Map(policies.map(policy => [policy.tenant, new Set(policy.routes)])); this.cache = new Map(); }
  resolve(path) { let match = null; for (const [prefix, route] of this.byPrefix) if (path.startsWith(prefix) && (!match || prefix.length > match.prefix.length)) match = route; return match; }
  middleware(route) { return route ? (route._chain ||= route.middleware.map(id => ({ id }))) : []; }
  authorized(tenant, route) { return Boolean(route && this.policies.get(tenant)?.has(route.id)); }
  backend(route, ticket = 0) { if (!route) return null; const total = route.backends.reduce((sum, item) => sum + item.weight, 0); let point = ticket % total; for (const item of route.backends) { point -= item.weight; if (point < 0) return item.id; } return route.backends[0].id; }
  cached(path) { if (this.cache.has(path)) return this.cache.get(path); const route = this.resolve(path); if (this.cache.size > 5_000) this.cache.delete(this.cache.keys().next().value); this.cache.set(path, route); return route; }
}
