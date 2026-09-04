import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePaymentTermDto {
  @ApiPropertyOptional({
    description: 'Organization scope. Omit/null for global.',
    nullable: true,
  })
  @IsOptional()
  @IsUUID('all')
  organizationId?: string | null;

  @ApiProperty({ example: 'NET30' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Net 30 days' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 30, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  daysDue?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}
