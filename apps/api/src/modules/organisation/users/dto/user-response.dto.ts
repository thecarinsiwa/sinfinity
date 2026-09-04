import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiPropertyOptional({ nullable: true })
  branchId!: string | null;

  @ApiProperty({ example: 'jane.doe@sinfinity.cd' })
  email!: string;

  @ApiProperty({ example: 'Jane' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiPropertyOptional({ nullable: true })
  lastLoginAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  emailVerifiedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CreateUserResponseDto extends UserResponseDto {
  @ApiPropertyOptional({
    description:
      'One-time set-password JWT when no initial password was provided',
  })
  setPasswordToken?: string;

  @ApiPropertyOptional({
    description: 'setPasswordToken TTL in seconds',
    example: 3600,
  })
  setPasswordExpiresIn?: number;
}

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'One-time JWT for POST /auth/set-password',
  })
  setPasswordToken!: string;

  @ApiProperty({
    description: 'Token TTL in seconds',
    example: 3600,
  })
  expiresIn!: number;
}
