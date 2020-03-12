import * as request from "supertest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestMicroservice } from "@nestjs/common";
import { TestService } from "./test-handler";
import { JSONRPCServer } from ".";

describe("json-rpc-e2e", () => {
  let app: INestMicroservice;
  let server: JSONRPCServer;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [TestService]
    }).compile();

    server = new JSONRPCServer({
      path: "/rpc/v1",
      port: 8080
    });

    app = moduleRef.createNestMicroservice({
      strategy: server
    });
    await app.init();
  });

  it(`/GET cats`, () => {
    return request(server.server)
      .post("/rpc/v1")
      .expect(200)
      .expect({
        data: "hi"
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
