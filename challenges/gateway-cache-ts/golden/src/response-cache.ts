export type Response = { status: number; body: string; tags?: string[]; ttlMs?: number }

type CacheEntry = { response: Response; expiresAt: number; tags: string[] }

export class ResponseCache {
  private readonly entries = new Map<string, CacheEntry>()
  private readonly tagKeys = new Map<string, Set<string>>()
  private readonly inFlight = new Map<string, Promise<Response>>()
  private readonly maxEntries: number

  constructor(maxEntries = 5_000) {
    this.maxEntries = maxEntries
  }

  get(key: string): Response | undefined {
    const entry = this.entries.get(key)
    if (!entry || entry.expiresAt <= Date.now()) return undefined
    this.entries.delete(key)
    this.entries.set(key, entry)
    return entry.response
  }

  set(key: string, value: Response): void {
    this.remove(key)
    while (this.entries.size >= this.maxEntries) this.remove(this.entries.keys().next().value!)
    const entry = { response: value, expiresAt: Date.now() + (value.ttlMs ?? 60_000), tags: value.tags ?? [] }
    this.entries.set(key, entry)
    for (const tag of entry.tags) (this.tagKeys.get(tag) ?? this.createTag(tag)).add(key)
  }

  purgeExpired(now = Date.now()): number {
    let removed = 0
    for (const [key, entry] of this.entries) if (entry.expiresAt <= now) { this.remove(key); removed++ }
    return removed
  }

  normalizeHeaders(headers: Array<[string, string]>): string {
    const normalized = new Map<string, string>()
    for (const [name, value] of headers) normalized.set(name.trim().toLowerCase(), value.trim())
    return [...normalized].sort(([left], [right]) => left.localeCompare(right)).map(([name, value]) => `${name}:${value}`).join("|")
  }

  async coalesce(key: string, loader: () => Promise<Response>): Promise<Response> {
    const existing = this.inFlight.get(key)
    if (existing) return existing
    const request = loader().finally(() => this.inFlight.delete(key))
    this.inFlight.set(key, request)
    return request
  }

  invalidateTag(tag: string): number {
    const keys = this.tagKeys.get(tag)
    if (!keys) return 0
    const count = keys.size
    for (const key of [...keys]) this.remove(key)
    return count
  }

  size(): number { return this.entries.size }

  private createTag(tag: string): Set<string> {
    const keys = new Set<string>()
    this.tagKeys.set(tag, keys)
    return keys
  }

  private remove(key: string): void {
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
