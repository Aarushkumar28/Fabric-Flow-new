import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  healthCheck() {
    return {
      status: 'ok',
      service: 'textile-flow-svc',
      timestamp: new Date().toISOString(),
    };
  }
}
