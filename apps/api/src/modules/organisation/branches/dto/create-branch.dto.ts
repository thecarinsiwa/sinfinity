import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export const BRANCH_TYPES = ['office', 'warehouse', 'mixed'] as const;
export type BranchType = (typeof BRANCH_TYPES)[number];

export class CreateBranchDto {
  @ApiPropertyOptional({
    description:
      'Defaults to the authenticated organization. Super-admin may set explicitly.',
  })
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'HQ-KIN' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Siège Kinshasa' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    enum: BRANCH_TYPES,
    example: 'office',
    default: 'office',
  })
  @IsOptional()
  @IsIn(BRANCH_TYPES)
  type?: BranchType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  cityId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  phone?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Optional manager user id (users module may validate later)',
  })
  @IsOptional()
  @IsUUID('all')
  managerUserId?: string | null;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
