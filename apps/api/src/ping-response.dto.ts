import { ApiProperty } from '@nestjs/swagger';

export class PingResponseDto {
  @ApiProperty({ example: 'ok', enum: ['ok'] })
  status!: 'ok';
}
