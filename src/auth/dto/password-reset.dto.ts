import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@tkpex.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiPropertyOptional({ example: 'eyJhbGciOi...' })
  @IsOptional()
  @IsString()
  resetToken?: string;

  @ApiPropertyOptional({ example: 'eyJhbGciOi...', description: 'Fallback alias for resetToken' })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiPropertyOptional({ example: 'user@tkpex.com', description: 'Optional email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'brandNewPassword123!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}

