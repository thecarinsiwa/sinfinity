import { CanActivate, Injectable } from '@nestjs/common';

/**
 * Stub until Phase 2 auth. Always allows the request.
 * Controllers declare `@ApiBearerAuth()` + this guard so wiring stays stable.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
