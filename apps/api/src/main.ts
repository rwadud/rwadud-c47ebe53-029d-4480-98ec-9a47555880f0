import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cookieParser = require('cookie-parser');

async function bootstrap() {
  // Ensure data directory exists
  const dbPath = process.env.DATABASE_PATH || './data/stms.sqlite';
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const app = await NestFactory.create(AppModule);

  // Parse cookies first
  app.use(cookieParser());

  // CSRF protection is handled by CsrfMiddleware in common/middleware/
  // It is applied via AppModule middleware consumer

  app.setGlobalPrefix('api');

  // Global exception filter for consistent error responses
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 API running on: http://localhost:${port}/api`);
}

bootstrap();
