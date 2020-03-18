import { Controller, Get, Inject, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy } from '@nestjs/microservices';
import { Message } from './message.event';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getRpcResponse();
  }
}
