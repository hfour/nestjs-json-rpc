/// <reference types="node" />
import { Server, CustomTransportStrategy } from "@nestjs/microservices";
import * as http from "http";
export interface RpcMetadata {
    namespace: string;
}
export declare const JSONRpcService: (metadata: RpcMetadata) => (constructor: Function) => void;
export interface JSONRPCServerOptions {
    /**
     * Listening port for the HTTP server
     */
    port: number;
    /**
     * Listening host (optional, defaults to any)
     */
    hostname?: string;
    path: string;
}
export declare class JSONRPCServer extends Server implements CustomTransportStrategy {
    private readonly options;
    server: http.Server | null;
    constructor(options: JSONRPCServerOptions);
    listen(callback: () => void): Promise<void>;
    close(): Promise<void>;
}
