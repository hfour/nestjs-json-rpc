# nestjs-json-rpc

[Docs](https://github.com/hfour/nestjs-json-rpc/wiki/Documentation) |
[Contributing](https://github.com/hfour/nestjs-json-rpc/wiki/Contributing) |
[Wiki](https://github.com/hfour/nestjs-json-rpc/wiki) |
[MIT Licensed](LICENSE.md)

A JSON-RPC microservice strategy implementation for NestJS.

Currently uses HTTP as the transport layer, with plans to add other options as the need arises.

## Install

`yarn add @hfour/nestjs-json-rpc`

## Usage example

Initialize similar to a regular microservice, but pass a `JsonRpcService` as the strategy option:

```typescript
const app = await NestFactory.createMicroservice(ApplicationModule, {
  strategy: new JsonRpcServer({
    path: "/rpc/v1",
    port: 8080
  })
});
```

Decorate your controllers with `@JsonRpcService`:

```typescript
@JSONRpcService({
  namespace: "test"
})
export class TestService implements ITestService {
  public async myMethod(params: any) {
    console.log("The method called was test.myMethod");
    return params;
  }
}
```

All the methods of the service will automatically be added with the name `<namespace>.<method>`.

Use any standard microservice decorators you would like to use:

```typescript
@UsePipes(TestPipe)
@UseInterceptors(TestInterceptor)
@UseGuards(TestGuard)
public async myMethod(params: any) {
  //...
}
```

The standard way to use these decorators would be:

- Input validation and transformation - use [NestJS Pipes](https://docs.nestjs.com/pipes)
- Access control checks, permission, role checks - use [NestJS Guards](https://docs.nestjs.com/guards)
- Transforming errors into appropriate CodedRpcExceptions (see below) - use [NestJS Exception Filters](https://docs.nestjs.com/exception-filters)
- All other aspect oriented programming bits (logging, tracing performance measurements etc): use [NestJS Interceptors](https://docs.nestjs.com/interceptors)

### Client

`nestjs-json-rpc` also comes with a way to create clients!

Simply initialize the client in any other service, then ask it to create a proxy for `TestService` for the given namespace:

```typescript
@injectable()
class MyServiceClient {
  private client = new JsonRpcClient("http://localhost:8080/rpc/v1");
  private service = this.client.getService<ITestService>("test");

  public doSomething() {
    // Invoke it just as if its a local service!
    return this.service.myMethod(paramsHere);
  }
}
```

## Errors

`nestjs-json-rpc` comes with `CodedRpcException`, which as per `JSONRPC` spec allows you to include an error code and additional data to the error. The error is reconstructed on the client and you can access and check the code and the data there as well.

Feel free to define your own code constants and declare a union of the types in order to be able to discriminate the codes:

```typescript
function isValidationError(e: CodedRpcException);
try {
  await this.service.myMethod(paramsHere);
} catch (e) {
  if (e.code === Codes.ValidationError) {
    // access validation errors here:
    e.data.validationErrors;
  }
}
```

You may also implement your own error hierarchy by means of subclassing, but you will not be able to use the `instanceof` checks on the client as errors are not reconstructed. Instead we recommend the following approach:

```typescript
const ValidationErrorCode = 400;
type ValidationErrorCode = 400;

type ValidationError = CodedRpcException & {
  code: ValidationErrorCode;
  data: {
    validationErrors: Array<{ path: string; problem: string }>;
  };
};

function isValidationError(e: any): e is ValidationError {
  return e instanceof CodedRpcException && e.code === ValidationErrorCode;
}
```
