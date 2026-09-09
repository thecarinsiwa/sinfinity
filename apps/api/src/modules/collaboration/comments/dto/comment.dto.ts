import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class CreateCommentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'ticket' })
  @IsString()
  @MaxLength(64)
  entityType!: string;

  @ApiProperty()
  @IsUUID('all')
  entityId!: string;

  @ApiProperty({ example: 'Looks good, proceed.' })
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  body!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Reply to another comment on the same entity',
  })
  @IsOptional()
  @IsUUID('all')
  parentCommentId?: string | null;
}

export class UpdateCommentDto {
  @ApiProperty({ example: 'Updated note' })
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  body!: string;
}

export class ListCommentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'ticket' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  entityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  authorId?: string;

  @ApiPropertyOptional({
    description: 'Only root comments (no parent)',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  rootsOnly?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeDeleted?: boolean;
}

export class ThreadCommentsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'ticket' })
  @IsString()
  @MaxLength(64)
  entityType!: string;

  @ApiProperty()
  @IsUUID('all')
  entityId!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeDeleted?: boolean;
}

export class CommentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  entityType!: string;

  @ApiProperty()
  entityId!: string;

  @ApiPropertyOptional({ nullable: true })
  authorId!: string | null;

  @ApiProperty()
  body!: string;

  @ApiPropertyOptional({ nullable: true })
  parentCommentId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  deletedAt!: string | null;
}

export class CommentThreadNodeDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  authorId!: string | null;

  @ApiProperty()
  body!: string;

  @ApiPropertyOptional({ nullable: true })
  parentCommentId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty({ type: () => [CommentThreadNodeDto] })
  children!: CommentThreadNodeDto[];
}
