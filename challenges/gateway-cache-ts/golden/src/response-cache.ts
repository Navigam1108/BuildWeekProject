export type Response = { status: number; body: string };

export class ResponseCache {
  private readonly maxEntries = 5_000;
  private readonly entries = new Map<string, Response>();

  get(key: string): Response | undefined {
    const value = this.entries.get(key);
    if (!value) return undefined;
    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }

  set(key: string, value: Response): void {
    this.entries.delete(key);
    if (this.entries.size >= this.maxEntries) this.entries.delete(this.entries.keys().next().value!);
    this.entries.set(key, value);
  }

  size(): number { return this.entries.size; }
}
