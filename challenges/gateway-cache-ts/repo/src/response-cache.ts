export type Response = { status: number; body: string };

export class ResponseCache {
  private entries = new Map<string, Response>();

  get(key: string): Response | undefined {
    return this.entries.get(key);
  }

  set(key: string, value: Response): void {
    this.entries.set(key, value);
  }

  size(): number {
    return this.entries.size;
  }
}
