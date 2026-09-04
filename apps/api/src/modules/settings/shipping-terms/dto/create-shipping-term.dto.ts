import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateShippingTermDto {
  @ApiProperty({
    example: 'FOB',
    description: 'Incoterm code (EXW, FOB, CIF, DDU, DDP…)',
  })
  @IsString()
  @MaxLength(32)
  code!: string;

  @ApiProperty({ example: 'Free On Board' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    example: '2020',
    description: 'Incoterms version',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  incotermVersion?: string | null;
}
