import { ApiProperty } from '@nestjs/swagger';

export class LeadSourceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'LINKEDIN' })
  code!: string;

  @ApiProperty({ example: 'LinkedIn' })
  name!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
