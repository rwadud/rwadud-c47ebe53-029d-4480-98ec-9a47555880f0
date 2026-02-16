import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cookieParser = require('cookie-parser');

const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADER = 'x-xsrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_EXEMPT = ['/api/auth/login'];

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

  // CSRF double-submit cookie protection
  // Sets XSRF-TOKEN cookie on every response.
  // For POST/PUT/DELETE/PATCH, validates X-XSRF-TOKEN header matches the cookie.
  // Angular's HttpClient handles this automatically.
  app.use((req: any, res: any, next: any) => {
    let token = req.cookies?.[CSRF_COOKIE];
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
    }
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    if (SAFE_METHODS.has(req.method) || CSRF_EXEMPT.includes(req.path)) {
      return next();
    }

    const headerToken = req.headers[CSRF_HEADER];
    if (!headerToken || headerToken !== token) {
      return res.status(403).json({
        message: 'Invalid or missing CSRF token',
        error: 'Forbidden',
        statusCode: 403,
      });
    }
    next();
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: ['http://localhost:4200'],
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 API running on: http://localhost:${port}/api`);
}

bootstrap();
