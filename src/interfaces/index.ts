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

export interface RpcMetadata {
    namespace: string;
}