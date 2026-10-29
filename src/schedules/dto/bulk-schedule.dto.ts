import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { TIME_PATTERN } from '../../common/utils/date.util.js';

export class BulkScheduleDto {
  @ApiProperty({ example: 'ca125726-6c1b-4d84-983e-cdd011769c73' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ example: [1, 2, 3, 4, 5], description: '1=Monday, 7=Sunday' })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  workDays: number[];

  @ApiProperty({ example: '09:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'startTime must be in HH:mm (24-hour) format' })
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'endTime must be in HH:mm (24-hour) format' })
  endTime: string;

  @ApiPropertyOptional({ example: '12:00', default: '12:00', description: 'Lunch break start' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'breakStart must be in HH:mm (24-hour) format' })
  breakStart?: string;

  @ApiPropertyOptional({ example: '13:00', default: '13:00', description: 'Lunch break end' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'breakEnd must be in HH:mm (24-hour) format' })
  breakEnd?: string;

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
  @ArrayNotEmpty()
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({ example: [1, 2, 3, 4, 5], description: '1=Monday, 7=Sunday' })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  workDays: number[];

  @ApiProperty({ example: '09:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'startTime must be in HH:mm (24-hour) format' })
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'endTime must be in HH:mm (24-hour) format' })
  endTime: string;

  @ApiPropertyOptional({ example: '12:00', default: '12:00', description: 'Lunch break start' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'breakStart must be in HH:mm (24-hour) format' })
  breakStart?: string;

  @ApiPropertyOptional({ example: '13:00', default: '13:00', description: 'Lunch break end' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'breakEnd must be in HH:mm (24-hour) format' })
  breakEnd?: string;

  @ApiPropertyOptional({ example: 'Cohort Morning Shift' })
  @IsOptional()
  @IsString()
  shiftName?: string;
}

