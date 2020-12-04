import { JsonRpcContext } from "./server";

export type RpcController<T> = {
  [K in keyof T]: T[K] extends (params: infer U) => infer Ret
    ? (params: U, ctx: JsonRpcContext) => Ret
    : never;
};
