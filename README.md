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
const app = NestFactory.create(ApplicationModule);
app.connectMicroservice({
  strategy: new JsonRpcServer({
    path: "/rpc/v1",
    port: 8080
    server: app.getHttpAdapter()
  })
});
await app.startAllMicroservicesAsync();
await app.listenAsync(3000);
```

Decorate your controllers with the `@RpcService` and `@RpcMethod` decorators:

```typescript
@RpcService({
  namespace: "test"
})
export class TestService implements ITestService {
  @RpcMethod()
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
@RpcMethod()
public async myMethod(params: any) {
  //...
}
```

For the different types of decorators, see:

- Input validation and transformation - use [NestJS Pipes](https://docs.nestjs.com/pipes)
- Access control checks, permission, role checks - use [NestJS Guards](https://docs.nestjs.com/guards)
- Transforming errors into appropriate CodedRpcExceptions (see below) - use [NestJS Exception Filters](https://docs.nestjs.com/exception-filters)
- All other aspect oriented programming bits (logging, tracing performance measurements etc): use [NestJS Interceptors](https://docs.nestjs.com/interceptors)

### Hybrid Mode

Running in Hybrid Mode allows you to use a JSON-RPC endpoint alongside an existing Nest.JS application, using the same port. This could be used to run side-by-side with a Healthcheck endpoint, for example. All the decorators remain the same, but the initialization of the microservice should be modified as follows:

```typescript
const app = NestFactory.create(ApplicationModule);
app.connectMicroservice({
  strategy: new JsonRpcServer({
    path: "/rpc/v1",
    server: app.getHttpAdapter()
  })
});

await app.startAllMicroservicesAsync();
await app.listenAsync(3000);
```

### Client

`nestjs-json-rpc` also comes with a way to create clients!

Simply initialize the client in any other service, then ask it to create a proxy for `TestService` for the given namespace:

```typescript
@Injectable()
class MyServiceClient {
  private client = new JsonRpcClient("http://localhost:8080/rpc/v1");
  private service = this.client.getService<ITestService>("test");

  public doSomething() {
    // Invoke it just as if its a local service!
    return this.service.myMethod(paramsHere);
  }
}
```

You may also pass client headers to be sent with every request, such as the authorization token

```typescript
let client = new JsonRpcClient("http://localhost:8080/rpc/v1", {
  Authorization: `Bearer ${token}`
});
```

### End-to-End Testing

You can write E2E tests with super-test, similar to the [NEST.JS Documentation](https://docs.nestjs.com/fundamentals/testing#end-to-end-testing). This will allow you to write tests without spinning up an HTTP Server (and using a real port).

```typescript
const moduleFixture = await Test.createTestingModule({
  imports: [ApplicationModule]
})
  .overrideProvider(ISomeProvider)
  .useClass(MockSomeProvider)
  .compile();

app = moduleFixture.createNestApplication();

app.connectMicroservice({
  strategy: {
    path: "/rpc/v1",
    server: app.getHttpAdapter()
  }
});

await app.startAllMicroservicesAsync();
await app.init();

await request(app.getHttpServer())
  .post("/rpc/v1")
  .send({
    jsonRpc: "2.0",
    method: "namespace.method",
    params: { foo: "bar" }
  })
  .expect(200)
  .expect({
    jsonrpc: "2.0",
    result: {
      message: "Hello World!"
    }
  });
```

## Context

You can access additional metadata info about the request (such as headers) using the context.

For example, to access the `Authorization` header within a guard:

```typescript
@Injectable()
class TestGuard implements CanActivate {
  canActivate(
    ctx: ExecutionContext
  ): boolean | Promise<boolean> | import("rxjs").Observable<boolean> {
    let authData = ctx
      .switchToRpc()
      .getContext<JsonRpcContext>()
      .getMetadataByKey("Authorization");

    if (authMetadata) {
      // ... check token
      return true;
    }
    return false;
  }
}
```

To enable different transports in the future, the metadata mechanism doesn't reveal the metadata transport method. This should allow for the option to implement a different (e.g. TCP based) transport in the future.

## Custom Data

Ideally, you should be using a per-request scope to manage custom data. However, since this NestJS functionality is fairly new and unexplored, `JsonRpcContext` allows you to store and retrieve custom context data in a type-safe way via the property `customData`

Contextual data pertaining to a single remote procedure call (a single "request") can be stored within this property.

To use this property, you need to instantiate a `TypesafeKey`.

The following example decodes and adds user info to the context. JWT is extracted from
the RPC request metadata (the Authorization header for our HTTP transport)

```typescript
import { TypesafeKey } from "@hfour/nestjs-json-rpc";
import { UserInfo } from "./my-code";

export const UserInfoKey = new TypesafeKey<UserInfo>("myapp:auth:UserInfo");

export class TestAuthenticateGuard implements CanActivate {
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToRpc().getContext<JsonRpcContext>();
    let jwtMetadata = ctx.getMetadataByKey("Authorization");
    if (!jwtMetadata) return false;
    const decoded: Result<UserInfo> = jwt.decodeBearer(jwtMetadata);
    if (decoded.error) return false;
    ctx.customData.set(UserInfoKey, decoded.result);
    return true;
  }
}
```

Then you can read it by injecting the context in the RPC method:

```typescript
  @UseGuards(TestAuthenticateGuard)
  @RpcMethod()
  public async getUserInfo(params: {}, @Ctx() ctx: JsonRpcContext) {
    const userData = ctx.customData.get(UserInfo);
    return Promise.resolve(data?.name);
  }
```

Or you could read the data from another guard, pipe or interceptor.

Note that you are responsible for managing the key space of custom data and ensuring there are no name conflicts.

## Errors

`nestjs-json-rpc` comes with `CodedRpcException`, which as per JSONRPC spec allows you to include an error code and additional data to the error. The error is reconstructed on the client and you can access and check the code and the data there as well.

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
