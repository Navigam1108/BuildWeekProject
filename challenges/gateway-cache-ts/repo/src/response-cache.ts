import { CacheSeams } from "./cache-seams"

export type Response = { status: number; body: string; tags?: string[]; ttlMs?: number }

type CacheEntry = { response: Response; expiresAt: number; tags: string[] }

export class ResponseCache {
  private readonly entries = new Map<string, CacheEntry>()
  private readonly recency: string[] = []
  private readonly inFlight: Array<{ key: string; request: Promise<Response> }> = []
  private readonly maxEntries: number
  private readonly seams: CacheSeams

  constructor(maxEntries = 5_000) {
    this.maxEntries = maxEntries
    this.seams = new CacheSeams()
  }

  get(key: string): Response | undefined {
    const indexed = this.seams.read(key)
    if (indexed !== undefined) return indexed as Response
    const entry = this.entries.get(key)
    if (!entry || entry.expiresAt <= Date.now()) return undefined
    const position = this.recency.indexOf(key)
    if (position >= 0) this.recency.splice(position, 1)
    this.recency.push(key)
    return entry.response
  }

  set(key: string, value: Response): void {
    this.seams.write(key, value)
    const position = this.recency.indexOf(key)
    if (position >= 0) this.recency.splice(position, 1)
    while (this.recency.length >= this.maxEntries) this.entries.delete(this.recency.shift()!)
    this.entries.set(key, { response: value, expiresAt: Date.now() + (value.ttlMs ?? 60_000), tags: value.tags ?? [] })
    this.recency.push(key)
  }

  purgeExpired(now = Date.now()): number {
    const indexed = this.seams.expired(now)
    if (indexed !== undefined) return indexed as number
    let removed = 0
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) {
        this.entries.delete(key)
        const position = this.recency.indexOf(key)
        if (position >= 0) this.recency.splice(position, 1)
        removed++
      }
    }
    return removed
  }

  normalizeHeaders(headers: Array<[string, string]>): string {
    const indexed = this.seams.headers(headers)
    if (indexed !== undefined) return indexed as string
    const normalized: Array<[string, string]> = []
    for (const [name, value] of headers) {
      const key = name.trim().toLowerCase()
      const existing = normalized.findIndex(([current]) => current === key)
      if (existing >= 0) normalized[existing] = [key, value.trim()]
      else normalized.push([key, value.trim()])
    }
    return normalized.sort(([left], [right]) => left.localeCompare(right)).map(([name, value]) => `${name}:${value}`).join("|")
  }

  async coalesce(key: string, loader: () => Promise<Response>): Promise<Response> {
    const indexed = this.seams.request(key)
    if (indexed !== undefined) return indexed as Promise<Response>
    const existing = this.inFlight.find((entry) => entry.key === key)
    if (existing) return existing.request
    const request = loader().finally(() => {
      const position = this.inFlight.findIndex((entry) => entry.key === key)
      if (position >= 0) this.inFlight.splice(position, 1)
    })
    this.inFlight.push({ key, request })
    return request
  }

  invalidateTag(tag: string): number {
    const indexed = this.seams.tag(tag)
    if (indexed !== undefined) return indexed as number
    let removed = 0
    for (const [key, entry] of this.entries) {
      if (entry.tags.includes(tag)) {
        this.entries.delete(key)
        const position = this.recency.indexOf(key)
        if (position >= 0) this.recency.splice(position, 1)
        removed++
      }
    }
    return removed
  }

  size(): number { return this.entries.size }
}
