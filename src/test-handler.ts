
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
  Scope,
} from '@nestjs/common';

const initialModuleState = {
  pipeCalled: false,
  guardCaled: false,
  interceptorCalled: false,
  serviceConstructorCount: 0,
  interceptorConstructorCount: 0,
};

export let DecorationsState = Object.assign({}, initialModuleState);

export function resetDecorationsState() {
  console.log('Reset count');
  Object.assign(DecorationsState, initialModuleState);
}

@Injectable()
class TestPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
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
    context: ExecutionContext,
    next: CallHandler<any>,
  ): import('rxjs').Observable<any> | Promise<import('rxjs').Observable<any>> {
    DecorationsState.interceptorCalled = true;
    return next.handle();
  }
}

@Injectable()
class TestGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | import('rxjs').Observable<boolean> {
    DecorationsState.guardCaled = true;
    return true;
  }
}

@JSONRpcService({
  namespace: 'test',
})
@Injectable({ scope: Scope.REQUEST })
export class TestService {
  constructor() {
    DecorationsState.serviceConstructorCount =
      DecorationsState.serviceConstructorCount + 1;
    console.log(
      'TestService count now at',
      DecorationsState.serviceConstructorCount,
    );
  }

  @UsePipes(TestPipe)
  @UseInterceptors(TestInterceptor)
  @UseGuards(TestGuard)
  public async invoke(params: any) {
    console.log('Invoke WAS called');
    return params;
  }
}
