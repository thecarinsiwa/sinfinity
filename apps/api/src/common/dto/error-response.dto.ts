import { ApiProperty } from '@nestjs/swagger';

/** Default Nest HTTP error body (examples tuned for 400 validation). */
export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: 'Validation failed' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['page must not be less than 1'],
      },
    ],
  })
  message!: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error!: string;
}

/** Nest `ServiceUnavailableException` body (e.g. health DB ping). */
export class ServiceUnavailableErrorResponseDto {
  @ApiProperty({ example: 503 })
  statusCode!: number;

  @ApiProperty({ example: 'Database unavailable' })
  message!: string;

  @ApiProperty({ example: 'Service Unavailable' })
  error!: string;
}
