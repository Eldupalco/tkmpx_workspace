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
      throw new UnauthorizedException('Current password does not match');
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
      { expiresIn: '15m' },
    );

    return {
      message: 'Password reset token generated successfully (valid for 15 minutes)',
      resetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(dto.resetToken, {
        secret: process.env.JWT_SECRET || 'tkpex-super-secret-jwt-key',
      });
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (payload.type !== 'reset_password') {
      throw new BadRequestException('Invalid token type for password reset');
    }

    const newHash = await argon2.hash(dto.newPassword);
    await this.prisma.users.update({
      where: { id: payload.sub },
      data: {
        password: newHash,
        updatedAt: new Date(),
      },
    });

    return { message: 'Password has been successfully reset' };
  }

  private async generateToken(userId: string, email: string, role: string) {
    return this.jwtService.signAsync({
      sub: userId,
      email,
      role,
    });
  }
}
