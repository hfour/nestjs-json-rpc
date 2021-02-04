import { TypesafeKey, TypesafeMap } from "./typesafe-map";

const MyKey1 = new TypesafeKey<{ test: string }>("hfour:jsonrpc:mykey1");
const MyKey2 = new TypesafeKey<{ second: string }>("hfour:jsonrpc:mykey2");

describe("typesafe-map", () => {
  it("works with typesafe keys", () => {
    let m = new TypesafeMap();

    m.set(MyKey1, { test: "value" });
    m.set(MyKey2, { second: "value2" });

    expect(m.get(MyKey1).test).toEqual("value");
    expect(m.get(MyKey2).second).toEqual("value2");
  });
});
