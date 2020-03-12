"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("supertest");
const testing_1 = require("@nestjs/testing");
const test_handler_1 = require("./test-handler");
const _1 = require(".");
describe("json-rpc-e2e", () => {
    let app;
    let server;
    beforeAll(async () => {
        let moduleRef = await testing_1.Test.createTestingModule({
            controllers: [test_handler_1.TestService]
        }).compile();
        server = new _1.JSONRPCServer({
            path: "/rpc/v1",
            port: 8080
        });
        app = moduleRef.createNestMicroservice({ strategy: server });
        await new Promise(resolve => app.listen(resolve));
        console.log("Done init");
    });
    it(`/GET cats`, () => {
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
//# sourceMappingURL=index.spec.js.map