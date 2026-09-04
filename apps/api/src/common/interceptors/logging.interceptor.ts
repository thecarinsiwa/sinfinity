import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const { method, originalUrl } = request;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = http.getResponse<Response>();
          this.logger.log(
            `${method} ${originalUrl} ${response.statusCode} ${Date.now() - startedAt}ms`,
          );
        },
        error: (err: unknown) => {
          const status = err instanceof HttpException ? err.getStatus() : 500;
          this.logger.warn(
            `${method} ${originalUrl} ${status} ${Date.now() - startedAt}ms`,
          );
        },
      }),
    );
  }
}
