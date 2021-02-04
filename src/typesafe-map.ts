export class TypesafeKey<T> {
  //@ts-ignore
  private " __brand"!: T;

  constructor(private namespace: string) {}

  toString() {
    return this.namespace;
  }
}

export class TypesafeMap {
  private map = new Map();

  get<T>(key: TypesafeKey<T>): T {
    return this.map.get(key.toString());
  }

  set<T>(key: TypesafeKey<T>, value: T) {
    this.map.set(key.toString(), value);
    return this;
  }

  delete<T>(key: TypesafeKey<T>) {
    return this.map.delete(key.toString());
  }

  has<T>(key: TypesafeKey<T>) {
    return this.map.has(key.toString());
  }
}
