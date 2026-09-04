import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import {
  CurrentUser,
  ErrorResponseDto,
  Public,
  SkipAudit,
  type AuthUser,
} from '../../common';
import { SWAGGER_BEARER_AUTH } from '../../config/constants';
import { SWAGGER_TAG } from '../../config/swagger-tags';
import { AuthService } from './auth.service';
import {
  AuthMeResponseDto,
  AuthTokensResponseDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags(SWAGGER_TAG.Auth)
@SkipAudit()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  login(
    @Body() dto: LoginDto,
    @Req() request: Request,
  ): Promise<AuthTokensResponseDto> {
    return this.authService.login(dto.email, dto.password, request);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token' })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  refresh(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
  ): Promise<AuthTokensResponseDto> {
    return this.authService.refresh(dto.refreshToken, request);
  }

  @Public()
  @Post('set-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Set password with invite / reset token',
    description: 'Accepts a JWT with purpose=password_reset. Revokes sessions.',
  })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  setPassword(@Body() dto: SetPasswordDto): Promise<void> {
    return this.authService.setPassword(dto.token, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth(SWAGGER_BEARER_AUTH)
  @ApiOperation({ summary: 'Revoke the current session' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  logout(@CurrentUser() user: AuthUser): Promise<void> {
    return this.authService.logout(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth(SWAGGER_BEARER_AUTH)
  @ApiOperation({ summary: 'Current authenticated user' })
  @ApiOkResponse({ type: AuthMeResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  me(@CurrentUser() user: AuthUser): Promise<AuthMeResponseDto> {
    return this.authService.me(user);
  }
}
