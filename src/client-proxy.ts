import { ClientProxy } from "@nestjs/microservices";
import axios from "axios";
import { CodedRpcException } from "./coded-error";
import { JsonRpcResponse } from "./transport-types";

function deserializeResponse<T>(
  responseData: JsonRpcResponse<T>
): { value: T } | { error: CodedRpcException } {
  if ("error" in responseData) {
    return {
      error: new CodedRpcException(
        responseData.error.message,
        responseData.error.code,
        responseData.error.data
      )
    };
  } else {
    return { value: responseData.result };
  }
}

export class JsonRpcClient extends ClientProxy {
  constructor(private readonly url: string, private readonly metadata?: { [key: string]: string }) {
    super();
  }
  private counter: number = 0;
  private jsonrpc: string = "2.0";

  connect(): Promise<any> {
    throw new Error('The "connect()" method is not supported in JSONRPC mode.');
  }
  close() {
    return Promise.resolve();
  }
  /**
   * Method is unsupported for JSONRPC
   */
  protected publish(packet: any, callback: (packet: any) => any): any {
    throw new Error("Method is not supported in JSONRPC mode.");
  }
  /**
   * Method is unsupported for JSONRPC
   */
  protected async dispatchEvent(packet: any): Promise<any> {
    throw new Error("Method is not supported in JSONRPC mode.");
  }
  getService<SvcInterface>(namespace: string): ServiceClient<SvcInterface> {
    let url = this.url;
    let id = ++this.counter;
    let headers = this.metadata;
    return new Proxy(
      {},
      {
        get(_obj, prop) {
          return async function(params: any) {
            let res = await axios.post(
              url,
              {
                method: namespace + "." + prop.toString(),
                params,
                jsonrpc: "2.0",
                id
              },
              {
                headers
              }
            );

            let result = deserializeResponse(res.data);
            if ("error" in result) throw result.error;
            else return result.value;
          };
        }
      }
    ) as ServiceClient<SvcInterface>;
  }
}
export type ServiceClient<Service> = {
  [MethodName in keyof Service]: Service[MethodName] extends (
    params: infer Params,
    ...injections: any
  ) => infer ReturnType
    ? (params: Params) => ReturnType extends Promise<any> ? ReturnType : Promise<ReturnType>
    : never;
};

