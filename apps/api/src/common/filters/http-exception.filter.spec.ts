import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function createHost(json: jest.Mock, status: jest.Mock): ArgumentsHost {
  status.mockReturnValue({ json });

  return {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({}),
    }),
  } as unknown as ArgumentsHost;
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('formats HttpException with object response', () => {
    const json = jest.fn();
    const status = jest.fn();
    const host = createHost(json, status);

    filter.catch(
      new BadRequestException({
        message: ['page must not be less than 1'],
        error: 'Bad Request',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      message: ['page must not be less than 1'],
      error: 'Bad Request',
    });
  });

  it('formats HttpException with string response', () => {
    const json = jest.fn();
    const status = jest.fn();
    const host = createHost(json, status);

    filter.catch(
      new HttpException('Access denied', HttpStatus.FORBIDDEN),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(json).toHaveBeenCalledWith({
      statusCode: 403,
      message: 'Access denied',
      error: 'Forbidden',
    });
  });

  it('uses Nest body error label when present', () => {
    const json = jest.fn();
    const status = jest.fn();
    const host = createHost(json, status);

    filter.catch(new ForbiddenException('Access denied'), host);

    expect(json).toHaveBeenCalledWith({
      statusCode: 403,
      message: 'Access denied',
      error: 'Forbidden',
    });
  });

  it('formats unknown errors as 500', () => {
    const json = jest.fn();
    const status = jest.fn();
    const host = createHost(json, status);

    filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  });
});
