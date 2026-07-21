export class ResponseCache {
  constructor(maxEntries = 5_000) {
    this.entries = new Map()
    this.tagKeys = new Map()
    this.inFlight = new Map()
    this.maxEntries = maxEntries
  }

  get(key) {
    const entry = this.entries.get(key)
    if (!entry || entry.expiresAt <= Date.now()) return undefined
    this.entries.delete(key)
    this.entries.set(key, entry)
    return entry.response
  }

  set(key, value) {
    this.remove(key)
    while (this.entries.size >= this.maxEntries) this.remove(this.entries.keys().next().value)
    const entry = { response: value, expiresAt: Date.now() + (value.ttlMs ?? 60_000), tags: value.tags ?? [] }
    this.entries.set(key, entry)
    for (const tag of entry.tags) (this.tagKeys.get(tag) ?? this.createTag(tag)).add(key)
  }

  purgeExpired(now = Date.now()) {
    let removed = 0
    for (const [key, entry] of this.entries) if (entry.expiresAt <= now) { this.remove(key); removed++ }
    return removed
  }

  normalizeHeaders(headers) {
    const normalized = new Map()
    for (const [name, value] of headers) normalized.set(name.trim().toLowerCase(), value.trim())
    return [...normalized].sort(([left], [right]) => left.localeCompare(right)).map(([name, value]) => `${name}:${value}`).join("|")
  }

  async coalesce(key, loader) {
    const existing = this.inFlight.get(key)
    if (existing) return existing
    const request = loader().finally(() => this.inFlight.delete(key))
    this.inFlight.set(key, request)
    return request
  }

  invalidateTag(tag) {
    const keys = this.tagKeys.get(tag)
    if (!keys) return 0
    const count = keys.size
    for (const key of [...keys]) this.remove(key)
    return count
  }

  size() { return this.entries.size }

  createTag(tag) {
    const keys = new Set()
    this.tagKeys.set(tag, keys)
    return keys
  }

  remove(key) {
    const entry = this.entries.get(key)
    if (!entry) return
    this.entries.delete(key)
    for (const tag of entry.tags) {
      const keys = this.tagKeys.get(tag)
      keys?.delete(key)
      if (keys?.size === 0) this.tagKeys.delete(tag)
    }
  }
}
