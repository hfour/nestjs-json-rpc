import { SetMetadata } from "@nestjs/common";
import * as express from "express";
import { Server, CustomTransportStrategy } from "@nestjs/microservices";
import * as http from "http";
import { createBrotliCompress } from "zlib";

const RPC_METADATA_KEY = "__json-rpc-metadata__";
const JSON_RPC_OPTIONS = "__json-rpc-options__";

export interface RpcMetadata {
  namespace: string;
}

export const JSONRpcService = (metadata: RpcMetadata) => SetMetadata(RPC_METADATA_KEY, metadata);

export interface JSONRPCServerOptions {
  /**
   * Listening port for the HTTP server
   */
  port: number;
  /**
   * Listening host (optional, defaults to any)
   */
  hostname?: string;
  /*
   * The path at which the JSON RPC endpoint should be mounted
   */
  path: string;
}

function invokeAsync<U>(fn: (cb: (err: Error | undefined | null, res?: U) => void) => void) {
  return new Promise<U>((resolve, reject) => {
    fn((err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}
export class JSONRPCServer extends Server implements CustomTransportStrategy {
  public server: http.Server | null = null;

  constructor(private readonly options: JSONRPCServerOptions) {
    super();
  }

  public async listen(callback: () => void) {
    let app = express();
    let handlers = this.getHandlers();
    for (let [k, v] of handlers) {
      console.log(k, v);
    }
    app.post(this.options.path, (req, res) => {
      res.end("Hello world");
    });
    this.server = await invokeAsync(cb => {
      if (this.options.hostname != null) app.listen(this.options.port, this.options.hostname, cb);
      else app.listen(this.options.port, cb);
    });
    callback();
  }

  public async close() {
    await invokeAsync(cb => this.server && this.server.close(cb));
    // do nothing, maybe block further requests
  }
}
