import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SystemSettingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'default_currency' })
  key!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'JSON value (object, array, or primitive)',
    example: { code: 'USD' },
  })
  value!: unknown;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
