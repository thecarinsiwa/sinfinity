import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ErrorResponseDto } from '../dto/error-response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = this.buildBody(exception, statusCode);
    response.status(statusCode).json(body);
  }

  private buildBody(exception: unknown, statusCode: number): ErrorResponseDto {
    const fallbackError = this.statusLabel(statusCode);

    if (!(exception instanceof HttpException)) {
      return {
        statusCode,
        message: 'Internal server error',
        error: fallbackError,
      };
    }

    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return {
        statusCode,
        message: exceptionResponse,
        error: fallbackError,
      };
    }

    const payload = exceptionResponse as {
      message?: string | string[];
      error?: string;
    };

    return {
      statusCode,
      message: payload.message ?? exception.message,
      error: payload.error ?? fallbackError,
    };
  }

  private statusLabel(statusCode: number): string {
    const key = HttpStatus[statusCode];
    if (typeof key !== 'string') {
      return 'Error';
    }

    return key
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
