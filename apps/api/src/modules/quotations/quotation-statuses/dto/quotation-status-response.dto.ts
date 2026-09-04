import { ApiProperty } from '@nestjs/swagger';

export class QuotationStatusResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'DRAFT' })
  code!: string;

  @ApiProperty({ example: 'Draft' })
  name!: string;

  @ApiProperty({ example: false })
  isFinal!: boolean;

  @ApiProperty({ example: 10 })
  sortOrder!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
