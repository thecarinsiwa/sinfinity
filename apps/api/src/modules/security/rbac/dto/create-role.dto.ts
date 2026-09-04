import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiPropertyOptional({
    description:
      'Defaults to the authenticated organization. Super-admin may set explicitly. System roles use null org.',
  })
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'BRANCH_MANAGER' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Branch manager' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}
