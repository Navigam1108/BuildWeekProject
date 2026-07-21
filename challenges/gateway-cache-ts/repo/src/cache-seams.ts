export class CacheSeams {
  read(_key: string) { return undefined }
  write(_key: string, _value: unknown) { return undefined }
  expired(_now: number) { return undefined }
  headers(_headers: Array<[string, string]>) { return undefined }
  request(_key: string) { return undefined }
  tag(_tag: string) { return undefined }
}
