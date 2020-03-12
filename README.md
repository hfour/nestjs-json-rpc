# nestjs-json-rpc

A JSONRPC microservice strategy implementation for NestJS.

Currently uses HTTP as the transport layer, with plans to add other options as the need arises.

## Install

yarn add @hfour/nestjs-json-rpc

## Usage example

Initialize similar to a regular microservice, but pass a JSONRPCServier as the strategy option:

```typescript
const app = await NestFactory.createMicroservice(ApplicationModule, {
  strategy: new JSONRPCServer({
    path: "/rpc/v1",
    port: 8080
  })
});
```

Decorate your controllers with @JSONRPCService

```typescript
@JSONRpcService({
  namespace: "test"
})
export class TestService {
  public async myMethod(params: any) {
    console.log("The method called was test.myMethod");
    return params;
  }
}
```

All the methods of the service will automatically be added with the name `<namespace>.<method>`

Use any standard microservice decorators:

```typescript
  @UsePipes(TestPipe)
  @UseInterceptors(TestInterceptor)
  @UseGuards(TestGuard)
  public async myMethod(params: any) {
    //...
  }
```

## Licence

MIT
