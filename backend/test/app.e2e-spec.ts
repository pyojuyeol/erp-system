import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppModule (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  it('/api/auth/login (POST) - 유효하지 않은 요청은 400을 반환한다', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'not-an-email' })
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
