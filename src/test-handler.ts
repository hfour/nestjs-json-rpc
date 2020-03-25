import {
  UsePipes,
  PipeTransform,
  Injectable,
  NestInterceptor,
  CanActivate,
  ExecutionContext,
  CallHandler,
  ArgumentMetadata,
  UseInterceptors,
  UseGuards,
  Scope
} from "@nestjs/common";

import { JSONRpcService, CodedRpcException } from ".";

const initialModuleState = {
  pipeCalled: false,
  guardCaled: false,
  interceptorCalled: false,
  serviceConstructorCount: 0,
  interceptorConstructorCount: 0
};

export let DecorationsState = Object.assign({}, initialModuleState);

export function resetDecorationsState() {
  Object.assign(DecorationsState, initialModuleState);
}

@Injectable()
class TestPipe implements PipeTransform {
  transform(value: any, _metadata: ArgumentMetadata) {
    DecorationsState.pipeCalled = true;
    return value;
  }
}

@Injectable({ scope: Scope.REQUEST })
class TestInterceptor implements NestInterceptor {
  constructor() {
    DecorationsState.interceptorConstructorCount++;
  }

  intercept(
    _context: ExecutionContext,
    next: CallHandler<any>
  ): import("rxjs").Observable<any> | Promise<import("rxjs").Observable<any>> {
    DecorationsState.interceptorCalled = true;
    return next.handle();
  }
}

@Injectable()
class TestGuard implements CanActivate {
  canActivate(
    _context: ExecutionContext
  ): boolean | Promise<boolean> | import("rxjs").Observable<boolean> {
    DecorationsState.guardCaled = true;
    return true;
  }
}

@JSONRpcService({
  namespace: "test"
})
export class TestService implements ITestClientService {
  constructor() {
    DecorationsState.serviceConstructorCount = DecorationsState.serviceConstructorCount + 1;
    console.log("TestService count now at", DecorationsState.serviceConstructorCount);
  }

  @UsePipes(TestPipe)
  @UseInterceptors(TestInterceptor)
  @UseGuards(TestGuard)
  public async invoke(params: any) {
    console.log("Invoke WAS called");
    return params;
  }

  @UsePipes(TestPipe)
  @UseInterceptors(TestInterceptor)
  @UseGuards(TestGuard)
  public async testError(params: any) {
    // construct the error object with some data inside
    throw new CodedRpcException("RPC EXCEPTION", 403, { fromService: "Test Service", params });
  }

  @UsePipes(TestPipe)
  @UseInterceptors(TestInterceptor)
  @UseGuards(TestGuard)
  public async invokeClientService(params: any) {
    console.log("Invoke Client Service WAS called");
    return params;
  }
}

export interface ITestClientService {
  invokeClientService(params: any): any;
  testError(params: any): any;
}
