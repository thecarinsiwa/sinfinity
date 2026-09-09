import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class CreateExpenseCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'TRANSPORT' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Transport & logistics' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  parentId?: string | null;
}

export class UpdateExpenseCategoryDto {
  @ApiPropertyOptional({ example: 'TRANSPORT' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  parentId?: string | null;
}

export class ListExpenseCategoriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'TRANS' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter direct children of this parent',
  })
  @IsOptional()
  @IsUUID('all')
  parentId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeDeleted?: boolean;
}

export class ExpenseCategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  parentId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  deletedAt!: string | null;
}

export class ExpenseCategoryTreeNodeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: () => [ExpenseCategoryTreeNodeDto] })
  children!: ExpenseCategoryTreeNodeDto[];
}
