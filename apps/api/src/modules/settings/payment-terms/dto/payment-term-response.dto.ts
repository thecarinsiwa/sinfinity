import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentTermResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  organizationId!: string | null;

  @ApiProperty({ example: 'NET30' })
  code!: string;

  @ApiProperty({ example: 'Net 30 days' })
  name!: string;

  @ApiProperty({ example: 30 })
  daysDue!: number;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
