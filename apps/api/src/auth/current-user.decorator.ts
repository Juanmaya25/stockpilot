import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/** Shape attached to the request by JwtStrategy.validate(). */
export interface AuthUser {
  userId: string;
  email: string;
  businessId: string;
  role: string;
}

/** Injects the authenticated user into a controller handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: AuthUser }>();
    return request.user;
  },
);
