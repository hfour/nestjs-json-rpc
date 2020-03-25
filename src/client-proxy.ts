import { ClientProxy } from "@nestjs/microservices";
import axios from "axios";
import { resolve } from "dns";

export class JSONRPCClient extends ClientProxy {
  constructor(private readonly url: string) {
    super();
  }
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
    return new Proxy(
      {},
      {
        get(obj, prop) {
          return function(params: any) {
            return axios
              .post(url, { method: namespace + "." + prop.toString(), params, jsonrpc: "2.0" })
              .then(res => Promise.resolve(res))
              .catch(err => {
                const { code, message, data } = err.response.data;
                let resp = { code, message, data };

                return Promise.resolve(resp);
              });
          };
        }
      }
    ) as ServiceClient<SvcInterface>;
  }
}
export type ServiceClient<Service> = {
  [MethodName in keyof Service]: Service[MethodName] extends (params: any) => Promise<any>
    ? Service[MethodName]
    : Service[MethodName] extends (params: infer Params) => infer ReturnType
    ? (params: Params) => Promise<ReturnType>
    : never;
};
