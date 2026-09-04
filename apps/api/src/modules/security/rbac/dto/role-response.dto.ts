import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'quotations' })
  module!: string;

  @ApiProperty({ example: 'approve' })
  action!: string;

  @ApiProperty({ example: 'quotations.approve' })
  code!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;
}

export class RoleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Null for global system roles',
  })
  organizationId!: string | null;

  @ApiProperty({ example: 'SALES' })
  code!: string;

  @ApiProperty({ example: 'Sales' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  isSystem!: boolean;

  @ApiProperty({ type: [PermissionResponseDto] })
  permissions!: PermissionResponseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
