import { Test } from "@nestjs/testing";
import { INestMicroservice } from "@nestjs/common";

import { TestService } from "./test-handler";
import { JSONRPCServer, CodedRpcException } from "./index";
import { JSONRPCClient } from "./client-proxy";

describe("json-rpc-e2e", () => {
  let app: INestMicroservice;
  let server: JSONRPCServer;
  let client: JSONRPCClient;
  let service: TestService;

  beforeAll(async () => {
    let moduleRef = await Test.createTestingModule({
      controllers: [TestService]
    }).compile();

    server = new JSONRPCServer({
      path: "/rpc/v1",
      port: 8080
    });

    client = new JSONRPCClient("http://localhost:8080/rpc/v1");

    service = client.getService<TestService>("test");

    app = moduleRef.createNestMicroservice({ strategy: server });
    await app.listenAsync();
  });

  it(`should make and RPC call with the JSONRPCClient`, () => {
    return service
      .invokeClientService({ data: "hi" })
      .then(res => expect(res.result.data).toStrictEqual({ data: "hi" }));
  });

  it(`should return an error and check error data from JSONRPCClient call`, async () => {
    const expectedCodedException = expect.objectContaining(
      new CodedRpcException("RPC EXCEPTION", 403, {
        fromService: "Test Service",
        params: { data: "hi" }
      })
    );

    const resp = service.testError({ data: "hi" });
    return expect(resp).rejects.toThrowError(expectedCodedException);
  });

  afterAll(async () => {
    await app.close();
  });
});
