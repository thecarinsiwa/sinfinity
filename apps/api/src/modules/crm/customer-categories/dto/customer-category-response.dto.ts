import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerCategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'NGO' })
  code!: string;

  @ApiProperty({ example: 'ONG' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
