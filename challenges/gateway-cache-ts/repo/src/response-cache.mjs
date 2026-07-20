export class ResponseCache {
  constructor() { this.entries = new Map(); }
  get(key) { return this.entries.get(key); }
  set(key, value) { this.entries.set(key, value); }
  size() { return this.entries.size; }
}
