import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  EXPENSE_STATUSES,
  type ExpenseStatus,
} from '../../expense-statuses';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateExpenseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Must belong to the same organization when set',
  })
  @IsOptional()
  @IsUUID('all')
  categoryId?: string | null;

  @ApiProperty({ example: 'Freight forwarding Kinshasa' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ example: '1250.0000' })
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiProperty({ example: '2026-04-10', description: 'ISO date YYYY-MM-DD' })
  @IsDateString()
  expenseDate!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  supplierId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Must belong to the same organization when set',
  })
  @IsOptional()
  @IsUUID('all')
  landedCostId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'User who paid / declared; defaults to current user',
  })
  @IsOptional()
  @IsUUID('all')
  paidBy?: string | null;
}

export class UpdateExpenseDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  categoryId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: '1250.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ example: '2026-04-10' })
  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  supplierId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  landedCostId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  paidBy?: string | null;
}

export class TransitionExpenseDto {
  @ApiProperty({
    enum: EXPENSE_STATUSES,
    description: 'draft→approved|rejected; approved→paid',
  })
  @IsIn([...EXPENSE_STATUSES])
  toStatus!: ExpenseStatus;
}

export class ListExpensesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'freight' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: EXPENSE_STATUSES })
  @IsOptional()
  @IsIn([...EXPENSE_STATUSES])
  status?: ExpenseStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  landedCostId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeDeleted?: boolean;
}

export class ExpenseResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiPropertyOptional({ nullable: true })
  categoryId!: string | null;

  @ApiProperty()
  title!: string;

  @ApiProperty({ example: '1250.0000' })
  amount!: string;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiProperty({ example: '2026-04-10' })
  expenseDate!: string;

  @ApiPropertyOptional({ nullable: true })
  supplierId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  landedCostId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  paidBy!: string | null;

  @ApiProperty({ enum: EXPENSE_STATUSES })
  status!: ExpenseStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  deletedAt!: string | null;
}
