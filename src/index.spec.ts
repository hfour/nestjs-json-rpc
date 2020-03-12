import * as request from "supertest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestMicroservice, INestApplication } from "@nestjs/common";
import { TestService } from "./test-handler";
import { JSONRPCServer } from ".";

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

  it(`works`, () => {
    return request(server.server)
      .post("/rpc/v1")
      .send({ method: "test.invoke", params: { data: "hi" } })
      .expect(200)
      .expect({
        data: "hi"
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
