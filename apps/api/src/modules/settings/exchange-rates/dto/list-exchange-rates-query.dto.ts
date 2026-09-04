import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class ListExchangeRatesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  fromCurrencyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  toCurrencyId?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  rateDateFrom?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsDateString()
  rateDateTo?: string;
}

export class LatestExchangeRateQueryDto {
  @ApiProperty({
    example: 'USD',
    description: 'ISO 4217 source currency code',
  })
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Za-z]{3}$/)
  from!: string;

  @ApiProperty({
    example: 'CDF',
    description: 'ISO 4217 target currency code',
  })
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Za-z]{3}$/)
  to!: string;

  @ApiPropertyOptional({
    example: '2026-09-04',
    description:
      'As-of date (defaults to today UTC). Returns latest rate_date <= date.',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
