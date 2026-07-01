import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://fabric-flow-frontend-1uju.onrender.com',
    process.env.FRONTEND_URL ?? '',
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
});

  app
    .getHttpAdapter()
    .get(
      '/health',
      (
        _req: unknown,
        res: { status: (c: number) => { json: (d: unknown) => void } },
      ) => {
        res
          .status(200)
          .json({ status: 'ok', timestamp: new Date().toISOString() });
      },
    );

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
