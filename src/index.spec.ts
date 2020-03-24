import * as request from "supertest";

import { Test } from "@nestjs/testing";
import { INestMicroservice, ServiceUnavailableException } from "@nestjs/common";

import { TestService, TestClientService } from "./test-handler";
import { JSONRPCServer } from ".";
import { JSONRPCClient } from "./client-proxy";

describe("json-rpc-e2e", () => {
  let app: INestMicroservice;
  let server: JSONRPCServer;

  beforeAll(async () => {
    let moduleRef = await Test.createTestingModule({
      controllers: [TestService]
    }).compile();

    server = new JSONRPCServer({
      path: "/rpc/v1",
      port: 8080
    });

    app = moduleRef.createNestMicroservice({ strategy: server });
    await new Promise(resolve => app.listen(resolve));
  });

  it(`/rpc/v1/ test.invoke (POST)`, () => {
    return request(server.server)
      .post("/rpc/v1")
      .send({ method: "test.invoke", params: { data: "hi" } })
      .expect(200)
      .expect({
        data: "hi"
      });
  });

  it(`should throw an error on /rpc/v1/ test.testError (POST)`, () => {
    const errorObj = {
      message: "RPC EXCEPTION",
      code: 403,
      data: {
        fromService: "Test Service",
        params: { data: "hi" }
      }
    };
    return request(server.server)
      .post("/rpc/v1")
      .send({ method: "test.testError", params: { data: "hi" } })
      .expect(403)
      .expect(errorObj);
  });

  it(`should make and RPC call with the JSONRPCClient`, () => {
    console.log("Testing RPC CLient");
    const client = new JSONRPCClient("http://localhost:8080/rpc/v1");
    const service = client.getService<TestClientService>("test.service");

    return service.invokeService({ data: "hi" }).then(res => expect(res.data).toBe("hi"));
  });

  afterAll(async () => {
    await app.close();
  });
});
