import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class BulkScheduleDto {
  @ApiProperty({ example: 'ca125726-6c1b-4d84-983e-cdd011769c73' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ example: [1, 2, 3, 4, 5], description: '1=Monday, 7=Sunday' })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  workDays: number[];

  @ApiProperty({ example: '09:00' })
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsNotEmpty()
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ example: 'Standard Shift' })
  @IsOptional()
  @IsString()
  shiftName?: string;
}

export class BulkUsersScheduleDto {
  @ApiProperty({
    example: ['ca125726-6c1b-4d84-983e-cdd011769c73'],
    description: 'Array of user IDs',
  })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({ example: [1, 2, 3, 4, 5], description: '1=Monday, 7=Sunday' })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  workDays: number[];

  @ApiProperty({ example: '09:00' })
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsNotEmpty()
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ example: 'Cohort Morning Shift' })
  @IsOptional()
  @IsString()
  shiftName?: string;
}

