import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ITokenPayload } from '@stms/data';

/**
 * Parameter decorator that extracts the current user from the request.
 * Usage: @CurrentUser() user: ITokenPayload
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ITokenPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
