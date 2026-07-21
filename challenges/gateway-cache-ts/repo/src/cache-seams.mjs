import { EntrySeam } from "./entry-seam.mjs"
import { RequestSeam } from "./request-seam.mjs"

export class CacheSeams {
  constructor() {
    this.entries = new EntrySeam()
    this.requests = new RequestSeam()
  }

  read(key) { return this.entries.read(key) }
  write(key, value) { return this.entries.write(key, value) }
  expired(now) { return this.entries.expired(now) }
  headers(headers) { return this.requests.headers(headers) }
  request(key) { return this.requests.request(key) }
  tag(tag) { return this.entries.tag(tag) }
}
