import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  COMMISSIONING_TEST_RESULTS,
  type CommissioningTestResult,
} from '../../commissioning-test-results';

export class CreateInstallationReportDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  summary?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  findings?: string | null;

  @ApiPropertyOptional({
    type: [String],
    nullable: true,
    description: 'Document UUIDs belonging to the same organization',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  documentIds?: string[] | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Defaults to the authenticated user',
  })
  @IsOptional()
  @IsUUID('all')
  authorUserId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  reportedAt?: string | null;
}

export class UpdateInstallationReportDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  summary?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  findings?: string | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  documentIds?: string[] | null;
}

export class InstallationReportResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  installationId!: string;

  @ApiPropertyOptional({ nullable: true })
  authorUserId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  summary!: string | null;

  @ApiPropertyOptional({ nullable: true })
  findings!: string | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  documentIds!: string[] | null;

  @ApiProperty()
  reportedAt!: string;

  @ApiProperty()
  createdAt!: string;
}

export class CreateCommissioningTestDto {
  @ApiProperty({ example: 'Fibre continuity' })
  @IsString()
  @MaxLength(255)
  testName!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    example: { step1: true, powerDb: -12.4 },
  })
  @IsOptional()
  @IsObject()
  checklist?: Record<string, unknown> | null;

  @ApiProperty({ enum: COMMISSIONING_TEST_RESULTS })
  @IsIn([...COMMISSIONING_TEST_RESULTS])
  result!: CommissioningTestResult;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  performedBy?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  performedAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  notes?: string | null;
}

export class UpdateCommissioningTestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  testName?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  checklist?: Record<string, unknown> | null;

  @ApiPropertyOptional({ enum: COMMISSIONING_TEST_RESULTS })
  @IsOptional()
  @IsIn([...COMMISSIONING_TEST_RESULTS])
  result?: CommissioningTestResult;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  performedBy?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  performedAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  notes?: string | null;
}

export class CommissioningTestResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  installationId!: string;

  @ApiProperty()
  testName!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  checklist!: Record<string, unknown> | null;

  @ApiPropertyOptional({ enum: COMMISSIONING_TEST_RESULTS, nullable: true })
  result!: CommissioningTestResult | null;

  @ApiPropertyOptional({ nullable: true })
  performedBy!: string | null;

  @ApiPropertyOptional({ nullable: true })
  performedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
