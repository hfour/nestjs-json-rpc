import { Module, HttpModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Transport, ClientsModule } from '@nestjs/microservices';

@Module({
  imports: [HttpModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
