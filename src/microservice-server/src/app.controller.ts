import {
  Controller,
  Get,
  UsePipes,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';

import { JSONRpcService } from 'json-rpc';
import {
  TestPipe,
  DecorationsState,
  TestInterceptor,
  TestGuard,
} from 'json-rpc/test-handler';

@JSONRpcService({
  namespace: 'test',
})
export class AppController {
  constructor() {
    DecorationsState.serviceConstructorCount =
      DecorationsState.serviceConstructorCount + 1;
    console.log(
      'TestService count now at',
      DecorationsState.serviceConstructorCount,
    );
  }

  //@UsePipes(TestPipe)
  @UseInterceptors(TestInterceptor)
  //@UseGuards(TestGuard)
  public async myMethod(params: any) {
    console.log('The method called was test.myMethod');
    console.log(params);
    return params;
  }
}
