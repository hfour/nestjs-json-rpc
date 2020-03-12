"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const express = require("express");
const microservices_1 = require("@nestjs/microservices");
exports.JSONRpcService = (metadata) => {
    return (constructor) => {
        __decorate([common_1.Injectable(), common_1.Controller()], constructor);
        for (let key of Object.getOwnPropertyNames(constructor.prototype))
            if (key !== "constructor") {
                if (typeof constructor.prototype[key] === "function") {
                    let dec = microservices_1.MessagePattern(metadata.namespace + "." + key);
                    __decorate([dec], constructor.prototype, key, null);
                }
            }
    };
};
function invokeAsync(fn) {
    return new Promise((resolve, reject) => {
        fn((err, res) => {
            if (err)
                reject(err);
            else
                resolve(res);
        });
    });
}
class JSONRPCServer extends microservices_1.Server {
    constructor(options) {
        super();
        this.options = options;
        this.server = null;
    }
    async listen(callback) {
        let app = express();
        app.post(this.options.path, express.json(), async (req, res) => {
            let handlers = this.getHandlers();
            let handler = this.getHandlerByPattern(req.body.method);
            if (handler == null)
                return res.status(404).json({ error: "Not Found" });
            let response = await handler(req.body.params)
                .then(res => res.toPromise())
                .then(value => ({ value }), error => ({ error }));
            if ("error" in response)
                res.status(500).json({ error: response.error.message });
            else
                res.status(200).json(response.value);
        });
        await invokeAsync(cb => {
            if (this.options.hostname != null)
                this.server = app.listen(this.options.port, this.options.hostname, cb);
            else
                this.server = app.listen(this.options.port, cb);
        });
        callback();
    }
    async close() {
        await invokeAsync(cb => this.server && this.server.close(cb));
        // do nothing, maybe block further requests
    }
}
exports.JSONRPCServer = JSONRPCServer;
//# sourceMappingURL=index.js.map