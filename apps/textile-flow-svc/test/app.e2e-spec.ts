import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

type HealthCheckResponse = {
  status: string;
  service: string;
  timestamp: string;
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        const body = res.body as HealthCheckResponse;

        expect(body).toMatchObject({
          status: 'ok',
          service: 'textile-flow-svc',
        });
        expect(typeof body.timestamp).toBe('string');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
