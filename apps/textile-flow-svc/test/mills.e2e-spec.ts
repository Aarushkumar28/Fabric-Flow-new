import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('MillsController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GSTIN unique constraints & empty string normalization', () => {
    it('should allow creating multiple mills with no GSTIN (empty string)', async () => {
      // 1st mill
      const res1 = await request(app.getHttpServer())
        .post('/mills')
        .send({
          name: 'Empty GSTIN Mill 1',
          gstin: '',
        })
        .expect(201);
      
      expect(res1.body.gstin).toBeNull(); // normalized to null

      // 2nd mill
      const res2 = await request(app.getHttpServer())
        .post('/mills')
        .send({
          name: 'Empty GSTIN Mill 2',
          gstin: '',
        })
        .expect(201);
      
      expect(res2.body.gstin).toBeNull();

      // 3rd mill
      const res3 = await request(app.getHttpServer())
        .post('/mills')
        .send({
          name: 'Empty GSTIN Mill 3',
          gstin: '',
        })
        .expect(201);

      expect(res3.body.gstin).toBeNull();
    });

    it('should reject creating a second mill with the SAME non-empty GSTIN', async () => {
      const uniqueGstin = `27AAAAA0000A1Z${Math.floor(Math.random() * 10)}`;

      // 1st mill with GSTIN
      await request(app.getHttpServer())
        .post('/mills')
        .send({
          name: 'Valid GSTIN Mill 1',
          gstin: uniqueGstin,
        })
        .expect(201);

      // 2nd mill with SAME GSTIN
      await request(app.getHttpServer())
        .post('/mills')
        .send({
          name: 'Valid GSTIN Mill 2',
          gstin: uniqueGstin,
        })
        .expect(400); // Or 409 depending on your error filter, but it must fail
    });
  });
});
