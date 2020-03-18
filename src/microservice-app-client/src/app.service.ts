import { Injectable, HttpService } from '@nestjs/common';
import * as JSON from 'circular-json';

@Injectable()
export class AppService {
  constructor(private http: HttpService) {}

  async getRpcResponse() {
    console.log('send to server');
    return await this.http
      .post('http://localhost:8080/rpc/v1', {
        method: 'test.myMethod',
        params: { data: 'hi' },
      })
      .toPromise()
      .then(res => JSON.stringify(res.data))
      .catch(err => console.log(err));
  }

  getHello(): string {
    return 'Hello World!';
  }
}
