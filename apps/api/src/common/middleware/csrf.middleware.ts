import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADER = 'x-xsrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
// Paths exempt from CSRF (e.g. login — client can't have a token yet)
const CSRF_EXEMPT_PATHS = ['/api/auth/login', '/auth/login'];

/**
 * Double-submit cookie CSRF protection.
 *
 * On every response, the server sets a random XSRF-TOKEN cookie (readable by JS).
 * For state-changing requests (POST, PUT, DELETE, PATCH), the client must echo
 * the cookie value in the X-XSRF-TOKEN header. The middleware compares the two —
 * if they don't match, the request is rejected.
 *
 * Angular's HttpClient does this automatically when it detects the XSRF-TOKEN cookie.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Always set/refresh the CSRF cookie so the client has a valid token
    let token = req.cookies?.[CSRF_COOKIE];
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
    }

    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,     // Must be readable by JavaScript
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    // Safe methods and exempt paths skip CSRF check
    const requestPath = req.originalUrl?.split('?')[0] || req.path;
    if (SAFE_METHODS.has(req.method) || CSRF_EXEMPT_PATHS.some(p => requestPath === p || requestPath.endsWith(p))) {
      return next();
    }

    // State-changing methods: verify the header matches the cookie
    const headerToken = req.headers[CSRF_HEADER] as string;
    if (!headerToken || headerToken !== token) {
      throw new ForbiddenException('Invalid or missing CSRF token');
    }

    next();
  }
}
