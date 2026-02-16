import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenPayload } from '@stms/data';

/**
 * Parameter decorator that extracts the current user from the request.
 * Usage: @CurrentUser() user: TokenPayload
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TokenPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
