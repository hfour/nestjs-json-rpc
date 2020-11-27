import { Controller, Injectable } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";

// TODO: check if there is a better method to manually apply decorators
declare let __decorate: Function;

const JSONRPC_CLASS_METADATA = "rpc::class::metadata";
const JSONRPC_METHOD_METADATA = "rpc::method::metadata";

export interface RpcMetadata {
  /**
   * The service namespace. RPC methods will be exposed in the format "namespacename.methodname"
   */
  namespace: string;
}

export interface RpcMethodMetadata {
  /**
   * The external name of the RPC method. It will be combined with the namespace of the class in
   * the format `namespace.name`. If not specified, it will default to the method name.
   */
  name?: string;
}

/**
 * Declares the controller to be a new JSON RPC service exposed at the specified namespace
 *
 * @params metadata - The service metadata.
 */
export function RpcService(metadata: RpcMetadata) {
  return (constructor: Function) => {
    Reflect.defineMetadata(JSONRPC_CLASS_METADATA, metadata, constructor);

    __decorate([Injectable(), Controller()], constructor);

    for (let key of Object.getOwnPropertyNames(constructor.prototype)) {
      if (key === "constructor") continue;
      if (typeof constructor.prototype[key] !== "function") continue;
      let methodMeta = Reflect.getMetadata(
        JSONRPC_METHOD_METADATA,
        constructor.prototype[key]
      ) as RpcMethodMetadata;
      if (methodMeta == null) continue;

      let methodName = methodMeta.name || key;

      let dec = MessagePattern(metadata.namespace + "." + methodName);
      __decorate([dec], constructor.prototype, key, null);
    }
  };
}

/**
 * Declares a new method to be exposed by the service. Note that the service must also be decorated
 * with the JSONRpcService decorator
 *
 * @param metadata - Specifies method options (e.g. the external name)
 */
export const RpcMethod = (metadata?: RpcMethodMetadata) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(JSONRPC_METHOD_METADATA, metadata || {}, target[propertyName]);
  };
};
