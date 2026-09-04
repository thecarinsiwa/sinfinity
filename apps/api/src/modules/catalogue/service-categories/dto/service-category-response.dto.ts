import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceCategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'INSTALL' })
  code!: string;

  @ApiProperty({ example: 'Installation' })
  name!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
