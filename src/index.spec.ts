import * as request from 'supertest';

import { Test } from "@nestjs/testing";
import { INestApplication, INestMicroservice } from "@nestjs/common";

import { ITestClientService, TestService } from "./test-handler";
import { JsonRpcServer, JsonRpcClient, CodedRpcException } from ".";

describe("json-rpc-e2e", () => {
  let microservice: INestMicroservice;
  let app: INestApplication;
  let server: JsonRpcServer;
  let client: JsonRpcClient;
  let clientWithoutMetadata: JsonRpcClient;
  let service: ITestClientService;
  let unauthorizedService: ITestClientService;

  describe('standalone', () => {
    beforeAll(async () => {
      let moduleRef = await Test.createTestingModule({
        controllers: [TestService]
      }).compile();

      server = new JsonRpcServer({
        path: "/rpc/v1",
        port: 8080
      });

      client = new JsonRpcClient("http://localhost:8080/rpc/v1", {
        Authorization: "Bearer xyz"
      });

      clientWithoutMetadata = new JsonRpcClient("http://localhost:8080/rpc/v1");

      service = client.getService<ITestClientService>("test");

      unauthorizedService = clientWithoutMetadata.getService<ITestClientService>("test");

      microservice = moduleRef.createNestMicroservice({ strategy: server });
      await microservice.listenAsync();
    });

    it(`should make an RPC call with the JsonRpcClient`, async () => {
      let res = await service.invokeClientService({ test: "hi" });
      expect(res).toStrictEqual({ test: "hi" });
    });

    it(`should fail to make a request with an unauthorized JsonRpcClient`, async () => {
      let result = unauthorizedService.invokeClientService({ test: "hi" });
      await expect(result).rejects.toThrowError("Forbidden resource");
    });

    it(`should return an error and check error data from JsonRpcClient call`, async () => {
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

    it(`should inject the context`, async () => {
      const expectedCodedException = new CodedRpcException("Internal server error");
      const resp = await service.injectContext({});
      expect(resp.key).toEqual("Bearer xyz");
    });

    afterAll(async () => {
      await microservice.close();
    });
  });

  describe('hybrid', () => {
    beforeAll(async () => {
      let moduleRef = await Test.createTestingModule({
        controllers: [TestService]
      }).compile();
    
      app = moduleRef.createNestApplication();

      server = new JsonRpcServer({
        path: '/rpc',
        adapter: app.getHttpAdapter(),
      });

      app.connectMicroservice({ strategy: server });

      await app.startAllMicroservicesAsync();
      await app.init();
    });

    it('should invoke RPC methods on incoming HTTP requests', async () => {
      await request(app.getHttpServer())
        .post('/rpc')
        .set('Authorization', 'Bearer xyz')
        .send({
          jsonrpc: '2.0',
          method: 'test.invokeClientService',
          id: '1',
          params: {
            test: 'hi',
          },
        })
        .expect({
          jsonrpc: '2.0',
          id: '1',
          result: { test: 'hi' }
        });
    });

    it('should wrap json-rpc errors in http 200', async () => {
      await request(app.getHttpServer())
      .post('/rpc')
      .set('Authorization', 'Bearer xyz')
      .send({
        jsonrpc: '2.0',
        method: 'test.notExposed',
        id: '1',
        params: {
          test: 'hi',
        },
      })
      .expect({
        jsonrpc: '2.0',
        id: '1',
        error: { 
          code: 404, 
          data: {}, 
          message: 'Method not found: test.notExposed',
        }
      });
    });
  });
});
