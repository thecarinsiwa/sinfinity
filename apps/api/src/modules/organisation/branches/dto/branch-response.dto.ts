import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BRANCH_TYPES, type BranchType } from './create-branch.dto';

export class BranchResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'HQ-KIN' })
  code!: string;

  @ApiProperty({ example: 'Siège Kinshasa' })
  name!: string;

  @ApiProperty({ enum: BRANCH_TYPES, example: 'office' })
  type!: BranchType;

  @ApiPropertyOptional({ nullable: true })
  address!: string | null;

  @ApiPropertyOptional({ nullable: true })
  cityId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  managerUserId!: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
