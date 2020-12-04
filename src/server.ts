import * as bodyParser from "body-parser";
import * as express from "express";
import * as http from "http";

import { Server, CustomTransportStrategy } from "@nestjs/microservices";
import { HttpServer } from "@nestjs/common";

import { JsonRpcResponse } from "./transport-types";
import { CodedRpcException } from "./coded-error";

export class JsonRpcContext {
  constructor(private req: express.Request, private server: express.Application) {}

  getMetadataByKey(metadataKey: string): string | undefined {
    return this.req.get(metadataKey);
  }
}

interface JsonRpcServerOptions {
  /**
   * The path at which the JSON RPC endpoint should be mounted
   */
  path: string;

  /**
   * The HTTP Server provided by the Nest runtime
   */
  server: HttpServer;
}

/**
 * Helper to serialize JSONRPC responses
 */
function serializeResponse<T>(
  id: string,
  response: { value: T } | { error: CodedRpcException }
): JsonRpcResponse<T> {
  if ("error" in response) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: response.error.code || 500,
        data: response.error.data,
        message: response.error.message
      }
    };
  } else {
    return { jsonrpc: "2.0", id, result: response.value };
  }
}

export class JsonRpcServer extends Server implements CustomTransportStrategy {
  public server: http.Server | null = null;

  /**
   * Creates a new JSON RPC Server strategy. When used to create a NestJS microservice, it will
   * expose a new microservce with a HTTP transport which implements JSON-RPC
   */
  constructor(private readonly options: JsonRpcServerOptions) {
    super();
  }

  public async listen(callback: () => void) {
    let app = this.options.server ?? express();
    app.use(bodyParser.json());

    app.post(this.options.path, async (req, res) => {
      let handler = this.getHandlerByPattern(req.body.method);

      if (handler == null) {
        let error = new CodedRpcException("Method not found: " + req.body.method, 404);
        return res.status(200).json(serializeResponse(req.body.id, { error }));
      }

      let context = new JsonRpcContext(req, app.getHttpServer());

      let observableResult = this.transformToObservable(await handler(req.body.params, context));
      let promiseResult = observableResult.toPromise();

      let response = await promiseResult.then(
        value => ({ value }),
        error => ({ error })
      );

      res.status(200).json(serializeResponse(req.body.id, response));
    });

    callback();
  }

  public async close() {
    // do nothing, maybe block further requests
  }
}
