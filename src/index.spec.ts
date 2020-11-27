import { Test } from "@nestjs/testing";
import { INestMicroservice } from "@nestjs/common";

import { TestService } from "./test-handler";
import { JSONRPCServer, JSONRPCClient, CodedRpcException } from ".";

describe("json-rpc-e2e", () => {
  let app: INestMicroservice;
  let server: JSONRPCServer;
  let client: JSONRPCClient;
  let clientWithoutMetadata: JSONRPCClient;
  let service: TestService;
  let unauthorizedService: TestService;

  beforeAll(async () => {
    let moduleRef = await Test.createTestingModule({
      controllers: [TestService]
    }).compile();

    server = new JSONRPCServer({
      path: "/rpc/v1",
      port: 8080
    });

    client = new JSONRPCClient("http://localhost:8080/rpc/v1", {
      Authorization: "Bearer xyz"
    });

    clientWithoutMetadata = new JSONRPCClient("http://localhost:8080/rpc/v1");

    service = client.getService<TestService>("test");

    unauthorizedService = clientWithoutMetadata.getService<TestService>("test");

    app = moduleRef.createNestMicroservice({ strategy: server });
    await app.listenAsync();
  });

  it(`should make and RPC call with the JSONRPCClient`, async () => {
    let res = await service.invokeClientService({ test: "hi" });
    expect(res).toStrictEqual({ test: "hi" });
  });

  it(`should fail to make a request with an unauthorized JSONRPCClient`, async () => {
    let result = unauthorizedService.invokeClientService({ test: "hi" });
    await expect(result).rejects.toThrowError("Forbidden resource");
  });

  it(`should return an error and check error data from JSONRPCClient call`, async () => {
    const expectedCodedException = new CodedRpcException("RPC EXCEPTION", 403, {
      fromService: "Test Service",
      params: { data: "hi" }
    });

    const resp = service.testError({ errorTest: "hi" });
    await expect(resp).rejects.toThrowError(expectedCodedException);
  });

  it(`should fail to invoke unexposed methods`, async () => {
    const expectedCodedException = new CodedRpcException("Method not found: test.notExposed", 404);
    const resp = service.notExposed({ test: "data" });
    await expect(resp).rejects.toThrowError(expectedCodedException);
  });

  it(`should see unrecognized errors`, async () => {
    const expectedCodedException = new CodedRpcException("Internal server error");
    const resp = service.unrecognizedError({});
    await expect(resp).rejects.toThrowError(expectedCodedException);
  });

  afterAll(async () => {
    await app.close();
  });
});
