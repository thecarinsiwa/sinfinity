import { ApiProperty } from '@nestjs/swagger';

export class SupplierCategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'ELEC' })
  code!: string;

  @ApiProperty({ example: 'Electronics' })
  name!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
