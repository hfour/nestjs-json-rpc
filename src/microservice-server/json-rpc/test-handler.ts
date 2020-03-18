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
  Object.assign(DecorationsState, initialModuleState);
}

@Injectable()
export class TestPipe implements PipeTransform {
  transform(value: any, _metadata: ArgumentMetadata) {
    DecorationsState.pipeCalled = true;
    return value;
  }
}

@Injectable({ scope: Scope.REQUEST })
export class TestInterceptor implements NestInterceptor {
  constructor() {
    DecorationsState.interceptorConstructorCount++;
  }

  intercept(
    _context: ExecutionContext,
    next: CallHandler<any>,
  ): import('rxjs').Observable<any> | Promise<import('rxjs').Observable<any>> {
    DecorationsState.interceptorCalled = true;
    return next.handle();
  }
}

@Injectable()
export class TestGuard implements CanActivate {
  canActivate(
    _context: ExecutionContext,
  ): boolean | Promise<boolean> | import('rxjs').Observable<boolean> {
    DecorationsState.guardCaled = true;
    return true;
  }
}
