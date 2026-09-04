import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivityTypeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'CALL' })
  code!: string;

  @ApiProperty({ example: 'Call' })
  name!: string;

  @ApiPropertyOptional({ nullable: true, example: 'phone' })
  icon!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
