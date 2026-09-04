import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import type { AuthenticatedRequest } from '../../common/types/auth-user.type';
import type { Env } from '../../config/env.validation';
import { AuthService } from './auth.service';
import {
  PASSWORD_RESET_PURPOSE,
  type AccessTokenPayload,
} from './auth.types';

/**
 * Validates Bearer JWT access tokens and populates `request.user`.
 * Routes marked `@Public()` skip authentication.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<
        AuthenticatedRequest & { headers: { authorization?: string } }
      >();
    const token = this.extractBearer(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: AccessTokenPayload & { purpose?: string };
    try {
      payload = await this.jwt.verifyAsync<
        AccessTokenPayload & { purpose?: string }
      >(token, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (payload.purpose === PASSWORD_RESET_PURPOSE) {
      throw new UnauthorizedException(
        'Password reset tokens cannot be used as access tokens',
      );
    }

    request.user = await this.authService.buildAuthUserFromAccessToken(payload);
    return true;
  }

  private extractBearer(authorization?: string): string | undefined {
    if (!authorization) {
      return undefined;
    }
    const [scheme, token] = authorization.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return undefined;
    }
    return token;
  }
}
