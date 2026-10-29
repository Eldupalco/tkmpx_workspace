import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginDto } from '../dto/login.dto.js';
import { RegisterDto } from '../dto/register.dto.js';
import { UpdateProfileDto } from '../dto/update-profile.dto.js';
import { ChangePasswordDto } from '../dto/change-password.dto.js';
import { ForgotPasswordDto, ResetPasswordDto } from '../dto/password-reset.dto.js';
import { getJwtSecret } from '../jwt-secret.js';
import { randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await argon2.hash(dto.password);

    const user = await this.prisma.users.create({
      data: {
        id: randomUUID(),
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: 'user',
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const accessToken = await this.generateToken(user.id, user.email, user.role);

    return {
      user,
      accessToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await argon2.verify(user.password, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const existing = await this.prisma.users.findFirst({
        where: { email: dto.email, NOT: { id: userId } },
      });
      if (existing) {
        throw new ConflictException('Email already in use by another account');
      }
    }

    return await this.prisma.users.update({
      where: { id: userId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.email ? { email: dto.email } : {}),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentValid = await argon2.verify(user.password, dto.currentPassword);
    if (!isCurrentValid) {
      throw new BadRequestException('Current password does not match');
    }

    const newHash = await argon2.hash(dto.newPassword);
    await this.prisma.users.update({
      where: { id: userId },
      data: {
        password: newHash,
        updatedAt: new Date(),
      },
    });

    return { message: 'Password updated successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      // Return safe message without revealing user existence
      return {
        message: 'If an account exists with that email, a reset token has been issued',
      };
    }

    const resetToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, type: 'reset_password' },
      { expiresIn: '15m', secret: this.resetSecret(user.password) },
    );

    // No email delivery yet: the token is only returned when explicitly enabled for local development
    if (process.env.EXPOSE_RESET_TOKEN === 'true') {
      return {
        message: 'Password reset token generated successfully (valid for 15 minutes)',
        resetToken,
      };
    }

    return {
      message: 'If an account exists with that email, a reset token has been issued',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const decoded: any = this.jwtService.decode(dto.resetToken);
    if (!decoded?.sub || decoded.type !== 'reset_password') {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: decoded.sub },
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Signed with the current password hash, so the token stops working once the password changes
    try {
      await this.jwtService.verifyAsync(dto.resetToken, {
        secret: this.resetSecret(user.password),
      });
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const newHash = await argon2.hash(dto.newPassword);
    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        password: newHash,
        updatedAt: new Date(),
      },
    });

    return { message: 'Password has been successfully reset' };
  }

  private resetSecret(passwordHash: string) {
    return `${getJwtSecret()}${passwordHash}`;
  }

  private async generateToken(userId: string, email: string, role: string) {
    return this.jwtService.signAsync({
      sub: userId,
      email,
      role,
    });
  }
}
