import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import {
  AuthEmailTokenStatus,
  TenantInvitationStatus,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser, JwtPayload } from '../../common/types/auth-user.type';
import { LoginDto } from './dto/login.dto';
import { RegisterDto, SelfRegistrationRole } from './dto/register.dto';
import {
  SetupAccountDto,
  ValidateSetupAccountTokenDto,
} from './dto/setup-account.dto';
import { hashInvitationToken } from '../tenant-invitations/tenant-invitations.service';
import { EmailService } from '../email/email.service';
import {
  AuthEmailDto,
  AuthTokenDto,
  ResetPasswordDto,
} from './dto/email-auth.dto';

interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      const email = dto.email.trim().toLowerCase();
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }

      const passwordHash = await bcrypt.hash(dto.password, 12);
      const role =
        dto.role === SelfRegistrationRole.LANDLORD
          ? UserRole.LANDLORD
          : UserRole.APPLICANT;
      const user = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email,
            passwordHash,
            role,
            profile: {
              create: {
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
              },
            },
          },
        });

        if (role === UserRole.LANDLORD) {
          await tx.landlord.create({ data: { userId: createdUser.id } });
        } else {
          await tx.applicant.create({ data: { userId: createdUser.id } });
        }

        return createdUser;
      });

      const verificationEmailQueued = await this.issueVerificationEmail(
        user.id,
        user.email,
        `${dto.firstName.trim()} ${dto.lastName.trim()}`,
      );
      return {
        user: this.toAuthUser(user),
        verificationEmailQueued,
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        this.logger.error(
          'Registration failed during account creation',
          process.env.NODE_ENV !== 'production' && error instanceof Error
            ? error.stack
            : undefined,
        );
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException(
        'Please verify your email address before signing in',
      );
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.createSession(user.id, user.email, user.role);
    return { user: this.toAuthUser(user), tokens };
  }

  async resendVerification(dto: AuthEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      include: { profile: true },
    });
    if (user && !user.deletedAt && !user.emailVerifiedAt) {
      const name = user.profile
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : user.email;
      await this.issueVerificationEmail(user.id, user.email, name);
    }
  }

  async verifyEmail(dto: AuthTokenDto) {
    const now = new Date();
    const verification = await this.findValidEmailVerificationToken(
      dto.token,
      now,
    );
    await this.prisma.$transaction(async (tx) => {
      const used = await tx.emailVerificationToken.updateMany({
        where: {
          id: verification.id,
          status: AuthEmailTokenStatus.PENDING,
          expiresAt: { gt: now },
        },
        data: { status: AuthEmailTokenStatus.USED, usedAt: now },
      });
      if (used.count !== 1) {
        throw new ConflictException('This verification link is no longer valid');
      }
      await tx.user.update({
        where: { id: verification.userId },
        data: { emailVerifiedAt: now },
      });
      await tx.emailVerificationToken.updateMany({
        where: {
          userId: verification.userId,
          id: { not: verification.id },
          status: AuthEmailTokenStatus.PENDING,
        },
        data: { status: AuthEmailTokenStatus.REVOKED },
      });
      await tx.activityLog.create({
        data: {
          actorId: verification.userId,
          action: 'auth.email_verified',
          entityType: 'User',
          entityId: verification.userId,
        },
      });
    });
    return { verified: true };
  }

  async forgotPassword(dto: AuthEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      include: { profile: true },
    });
    if (user && !user.deletedAt && user.isActive) {
      const name = user.profile
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : user.email;
      await this.issuePasswordResetEmail(user.id, user.email, name);
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords must match');
    }
    const now = new Date();
    const reset = await this.findValidPasswordResetToken(dto.token, now);
    const resetUser = await this.prisma.user.findUnique({
      where: { id: reset.userId },
      include: { profile: true },
    });
    const passwordHash = await bcrypt.hash(dto.password, 12);
    await this.prisma.$transaction(async (tx) => {
      const used = await tx.passwordResetToken.updateMany({
        where: {
          id: reset.id,
          status: AuthEmailTokenStatus.PENDING,
          expiresAt: { gt: now },
        },
        data: { status: AuthEmailTokenStatus.USED, usedAt: now },
      });
      if (used.count !== 1) {
        throw new ConflictException('This password reset link is no longer valid');
      }
      await tx.user.update({
        where: { id: reset.userId },
        data: { passwordHash, refreshTokenHash: null },
      });
      await tx.passwordResetToken.updateMany({
        where: {
          userId: reset.userId,
          id: { not: reset.id },
          status: AuthEmailTokenStatus.PENDING,
        },
        data: { status: AuthEmailTokenStatus.REVOKED },
      });
      await tx.activityLog.create({
        data: {
          actorId: reset.userId,
          action: 'auth.password_reset',
          entityType: 'User',
          entityId: reset.userId,
        },
      });
    });
    if (resetUser && !resetUser.deletedAt) {
      const name = resetUser.profile
        ? `${resetUser.profile.firstName} ${resetUser.profile.lastName}`
        : resetUser.email;
      await this.emailService.sendPasswordResetSuccessEmail({
        email: resetUser.email,
        name,
      });
    }
  }

  async validatePasswordResetToken(dto: AuthTokenDto) {
    const token = await this.findValidPasswordResetToken(dto.token, new Date());
    return { expiresAt: token.expiresAt };
  }

  async setupAccount(dto: SetupAccountDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords must match');
    }
    const now = new Date();
    const invitation = await this.findValidPendingInvitation(dto.token, now);

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.$transaction(async (tx) => {
      const accepted = await tx.tenantInvitation.updateMany({
        where: {
          id: invitation.id,
          status: TenantInvitationStatus.PENDING,
          acceptedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          status: TenantInvitationStatus.ACCEPTED,
          acceptedAt: now,
        },
      });
      if (accepted.count !== 1) {
        throw new ConflictException(
          'This account setup link is no longer available',
        );
      }
      const activated = await tx.user.update({
        where: { id: invitation.userId },
        data: {
          passwordHash,
          isActive: true,
          emailVerifiedAt: invitation.user.emailVerifiedAt ?? now,
        },
      });
      await tx.tenantInvitation.updateMany({
        where: {
          userId: invitation.userId,
          id: { not: invitation.id },
          status: TenantInvitationStatus.PENDING,
        },
        data: { status: TenantInvitationStatus.REVOKED },
      });
      await tx.activityLog.create({
        data: {
          actorId: invitation.userId,
          action: 'tenant_invitation.accepted',
          entityType: 'TenantInvitation',
          entityId: invitation.id,
          metadata: { tenancyId: invitation.tenancyId },
        },
      });
      return activated;
    });
    const tokens = await this.createSession(user.id, user.email, user.role);
    return { user: this.toAuthUser(user), tokens };
  }

  async validateSetupAccountToken(dto: ValidateSetupAccountTokenDto) {
    const invitation = await this.findValidPendingInvitation(
      dto.token,
      new Date(),
    );
    return {
      expiresAt: invitation.expiresAt,
    };
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (
      !user ||
      !user.refreshTokenHash ||
      user.deletedAt ||
      !user.isActive ||
      !user.emailVerifiedAt
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!tokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.createSession(user.id, user.email, user.role);
    return { user: this.toAuthUser(user), tokens };
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  async logoutFromRefreshToken(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
      await this.prisma.user.updateMany({
        where: { id: payload.sub },
        data: { refreshTokenHash: null },
      });
    } catch {
      // Stale or invalid cookies should still be cleared by the controller.
    }
  }

  private async createSession(
    id: string,
    email: string,
    role: UserRole,
  ): Promise<SessionTokens> {
    const payload: JwtPayload = { sub: id, email, role };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_EXPIRES_IN',
        '15m',
      ) as JwtSignOptions['expiresIn'],
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
        '7d',
      ) as JwtSignOptions['expiresIn'],
    });

    await this.prisma.user.update({
      where: { id },
      data: { refreshTokenHash: await bcrypt.hash(refreshToken, 12) },
    });

    return { accessToken, refreshToken };
  }

  private async findValidPendingInvitation(token: string, now: Date) {
    const invitation = await this.prisma.tenantInvitation.findUnique({
      where: { tokenHash: hashInvitationToken(token) },
      include: { user: true },
    });
    if (!invitation || invitation.status !== TenantInvitationStatus.PENDING) {
      throw new BadRequestException(
        'This account setup link is invalid or has already been used',
      );
    }
    if (invitation.expiresAt <= now) {
      await this.prisma.tenantInvitation.updateMany({
        where: {
          id: invitation.id,
          status: TenantInvitationStatus.PENDING,
        },
        data: { status: TenantInvitationStatus.EXPIRED },
      });
      throw new BadRequestException('This account setup link has expired');
    }
    if (invitation.user.isActive) {
      throw new ConflictException('Account setup has already been completed');
    }
    return invitation;
  }

  private async issueVerificationEmail(
    userId: string,
    email: string,
    name: string,
  ): Promise<boolean> {
    try {
      const { token, expiresAt } = this.createEmailToken();
      await this.prisma.$transaction([
        this.prisma.emailVerificationToken.updateMany({
          where: { userId, status: AuthEmailTokenStatus.PENDING },
          data: { status: AuthEmailTokenStatus.REVOKED },
        }),
        this.prisma.emailVerificationToken.create({
          data: {
            userId,
            tokenHash: hashAuthToken(token),
            expiresAt,
          },
        }),
      ]);
      return (await this.emailService.sendVerificationEmail({ email, name, token }))
        .success;
    } catch (error) {
      this.logger.error(
        `Unable to queue email verification for ${email}`,
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }

  private async issuePasswordResetEmail(
    userId: string,
    email: string,
    name: string,
  ): Promise<void> {
    try {
      const { token, expiresAt } = this.createEmailToken();
      await this.prisma.$transaction([
        this.prisma.passwordResetToken.updateMany({
          where: { userId, status: AuthEmailTokenStatus.PENDING },
          data: { status: AuthEmailTokenStatus.REVOKED },
        }),
        this.prisma.passwordResetToken.create({
          data: {
            userId,
            tokenHash: hashAuthToken(token),
            expiresAt,
          },
        }),
      ]);
      await this.emailService.sendPasswordResetEmail({ email, name, token });
    } catch (error) {
      this.logger.error(
        `Unable to queue password reset for ${email}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private createEmailToken() {
    const token = randomBytes(32).toString('base64url');
    const ttlHours = this.configService.get<number>('EMAIL_TOKEN_TTL_HOURS', 72);
    return {
      token,
      expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
    };
  }

  private async findValidEmailVerificationToken(token: string, now: Date) {
    const verification = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashAuthToken(token) },
    });
    if (
      !verification ||
      verification.status !== AuthEmailTokenStatus.PENDING
    ) {
      throw new BadRequestException(
        'This email verification link is invalid or has already been used',
      );
    }
    if (verification.expiresAt <= now) {
      await this.prisma.emailVerificationToken.updateMany({
        where: {
          id: verification.id,
          status: AuthEmailTokenStatus.PENDING,
        },
        data: { status: AuthEmailTokenStatus.EXPIRED },
      });
      throw new BadRequestException('This email verification link has expired');
    }
    return verification;
  }

  private async findValidPasswordResetToken(token: string, now: Date) {
    const reset = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashAuthToken(token) },
    });
    if (!reset || reset.status !== AuthEmailTokenStatus.PENDING) {
      throw new BadRequestException(
        'This password reset link is invalid or has already been used',
      );
    }
    if (reset.expiresAt <= now) {
      await this.prisma.passwordResetToken.updateMany({
        where: { id: reset.id, status: AuthEmailTokenStatus.PENDING },
        data: { status: AuthEmailTokenStatus.EXPIRED },
      });
      throw new BadRequestException('This password reset link has expired');
    }
    return reset;
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    role: UserRole;
  }): AuthUser {
    return { id: user.id, email: user.email, role: user.role };
  }
}

function hashAuthToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
