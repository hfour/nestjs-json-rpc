import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { JSONRPCServer } from 'json-rpc';

async function bootstrap() {
  const port = 8080;
  const app = await NestFactory.createMicroservice(AppModule, {
    strategy: new JSONRPCServer({
      path: '/rpc/v1',
      port,
    }),
  });
  app.listen(() =>
    console.log(`Microservice is listening on port ${port}
    `),
  );
}
bootstrap();
