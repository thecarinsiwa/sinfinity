import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { SKIP_AUDIT_KEY } from '../../../common/decorators/skip-audit.decorator';
import type { AuthenticatedRequest } from '../../../common/types/auth-user.type';
import { AuditService } from './audit.service';
import { sanitizeAuditPayload } from './audit-sanitize';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const SKIP_PATH_PREFIXES = [
  '/api/v1/auth',
  '/api/v1/health',
  '/api/v1/ping',
  '/api/v1/audit-logs',
];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<
      Request & AuthenticatedRequest & { params: Record<string, string> }
    >();
    const method = request.method.toUpperCase();

    if (!MUTATING_METHODS.has(method)) {
      return next.handle();
    }

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip || this.shouldSkipPath(request.path || request.url)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          void this.record(request, method, data);
        },
      }),
    );
  }

  private async record(
    request: Request & AuthenticatedRequest & { params: Record<string, string> },
    method: string,
    data: unknown,
  ): Promise<void> {
    const action = this.mapAction(method);
    const entityType = this.resolveEntityType(request.path || request.url);
    const entityId = this.resolveEntityId(request.params, request.body, data);
    const newValues = this.resolveNewValues(method, request.body, data);

    await this.auditService.write({
      organizationId: request.user?.organizationId ?? null,
      userId: request.user?.id ?? null,
      action,
      entityType,
      entityId,
      oldValues: null,
      newValues,
      ipAddress: this.resolveIp(request),
    });
  }

  private shouldSkipPath(path: string): boolean {
    const normalized = path.split('?')[0] ?? path;
    return SKIP_PATH_PREFIXES.some(
      (prefix) =>
        normalized === prefix || normalized.startsWith(`${prefix}/`),
    );
  }

  private mapAction(method: string): string {
    switch (method) {
      case 'POST':
        return 'create';
      case 'DELETE':
        return 'delete';
      default:
        return 'update';
    }
  }

  private resolveEntityType(path: string): string {
    const parts = path.split('/').filter(Boolean);
    let start = 0;
    if (parts[0] === 'api' && parts[1] === 'v1') {
      start = 2;
    }
    return parts[start] ?? 'unknown';
  }

  private resolveEntityId(
    params: Record<string, string>,
    body: unknown,
    data: unknown,
  ): string | null {
    if (params.id) {
      return params.id;
    }
    const fromData = this.readId(data);
    if (fromData) {
      return fromData;
    }
    return this.readId(body);
  }

  private readId(value: unknown): string | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    const id = (value as { id?: unknown }).id;
    return typeof id === 'string' ? id : null;
  }

  private resolveNewValues(
    method: string,
    body: unknown,
    data: unknown,
  ): unknown {
    if (method === 'DELETE') {
      return null;
    }
    if (data !== undefined && data !== null && data !== '') {
      return sanitizeAuditPayload(data);
    }
    return sanitizeAuditPayload(body);
  }

  private resolveIp(request: Request): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0]?.trim();
    return forwardedIp || request.ip || null;
  }
}
