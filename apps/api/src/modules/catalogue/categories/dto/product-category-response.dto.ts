import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductCategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'IT' })
  code!: string;

  @ApiProperty({ example: 'Informatique' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  parentId!: string | null;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ProductCategoryTreeNodeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'IT' })
  code!: string;

  @ApiProperty({ example: 'Informatique' })
  name!: string;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ type: () => [ProductCategoryTreeNodeDto] })
  children!: ProductCategoryTreeNodeDto[];
}
