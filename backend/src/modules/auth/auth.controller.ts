import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response, CookieOptions } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  AuthEmailDto,
  AuthTokenDto,
  ResetPasswordDto,
} from './dto/email-auth.dto';
import {
  SetupAccountDto,
  ValidateSetupAccountTokenDto,
} from './dto/setup-account.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Create a landlord or applicant account' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(dto);
    response.clearCookie('access_token', this.cookieOptions('/'));
    response.clearCookie('refresh_token', this.cookieOptions('/api/v1/auth'));
    return {
      message: 'Account created successfully. Verify your email to sign in.',
      data: {
        user: result.user,
        verificationEmailQueued: result.verificationEmailQueued,
      },
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Authenticate an account' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setSessionCookies(response, result.tokens);
    return { message: 'Login successful', data: { user: result.user } };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('setup-account')
  @ApiOperation({ summary: 'Activate an invited tenant account' })
  async setupAccount(
    @Body() dto: SetupAccountDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.setupAccount(dto);
    this.setSessionCookies(response, result.tokens);
    return {
      message: 'Account setup completed successfully',
      data: { user: result.user },
    };
  }

  @Public()
  @Get('setup-account/validate')
  @ApiOperation({ summary: 'Validate a pending tenant account setup link' })
  async validateSetupAccountToken(@Query() dto: ValidateSetupAccountTokenDto) {
    const invitation = await this.authService.validateSetupAccountToken(dto);
    return {
      message: 'Account setup link is valid',
      data: invitation,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('resend-verification')
  @ApiOperation({ summary: 'Request a fresh email verification link' })
  async resendVerification(@Body() dto: AuthEmailDto) {
    await this.authService.resendVerification(dto);
    return {
      message: 'If verification is needed, a new email has been prepared',
      data: null,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify an account email address' })
  async verifyEmail(@Body() dto: AuthTokenDto) {
    return {
      message: 'Email verified successfully',
      data: await this.authService.verifyEmail(dto),
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password recovery safely' })
  async forgotPassword(@Body() dto: AuthEmailDto) {
    await this.authService.forgotPassword(dto);
    return {
      message: 'If an account exists, a password reset email has been prepared',
      data: null,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using a one-time token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { message: 'Password reset successfully', data: null };
  }

  @Public()
  @Get('reset-password/validate')
  @ApiOperation({ summary: 'Validate a pending password reset link' })
  async validatePasswordResetToken(@Query() dto: AuthTokenDto) {
    return {
      message: 'Password reset link is valid',
      data: await this.authService.validatePasswordResetToken(dto),
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate a session refresh token' })
  async refresh(
    @Req() request: Request & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.refresh(
      request.cookies?.refresh_token,
    );
    this.setSessionCookies(response, result.tokens);
    return {
      message: 'Session refreshed successfully',
      data: { user: result.user },
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: 'End the current session' })
  async logout(
    @Req() request: Request & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logoutFromRefreshToken(
      request.cookies?.refresh_token,
    );
    response.clearCookie('access_token', this.cookieOptions('/'));
    response.clearCookie('refresh_token', this.cookieOptions('/api/v1/auth'));
    return { message: 'Logout successful', data: null };
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Return the authenticated account' })
  me(@CurrentUser() user: AuthUser) {
    return { message: 'Authenticated user retrieved', data: user };
  }

  private setSessionCookies(
    response: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    response.cookie('access_token', tokens.accessToken, {
      ...this.cookieOptions('/'),
      maxAge: 15 * 60 * 1000,
    });
    response.cookie('refresh_token', tokens.refreshToken, {
      ...this.cookieOptions('/api/v1/auth'),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private cookieOptions(path: string): CookieOptions {
    const domain = this.configService.get<string>('COOKIE_DOMAIN') || undefined;
    return {
      domain,
      path,
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
    };
  }
}
