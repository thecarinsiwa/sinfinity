import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'up', enum: ['up'] })
  status!: 'up';

  @ApiProperty({ example: 'up', enum: ['up'] })
  database!: 'up';

  @ApiProperty({ example: '0.0.1', description: 'API package version' })
  version!: string;
}
