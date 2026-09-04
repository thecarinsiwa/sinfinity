import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CreateUserRoleDto {
  @ApiProperty()
  @IsUUID('all')
  userId!: string;

  @ApiProperty()
  @IsUUID('all')
  roleId!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Optional branch scope for the assignment',
  })
  @IsOptional()
  @IsUUID('all')
  branchId?: string | null;
}

export class UserRoleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  roleId!: string;

  @ApiPropertyOptional({ nullable: true })
  branchId!: string | null;

  @ApiProperty()
  assignedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  assignedBy!: string | null;

  @ApiPropertyOptional({ example: 'SALES' })
  roleCode?: string;

  @ApiPropertyOptional({ example: 'Sales' })
  roleName?: string;
}
