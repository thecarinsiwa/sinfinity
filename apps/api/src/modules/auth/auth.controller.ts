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
  type AuthUser,
} from '../../common';
import { SWAGGER_BEARER_AUTH } from '../../config/constants';
import { AuthService } from './auth.service';
import {
  AuthMeResponseDto,
  AuthTokensResponseDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Auth')
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
