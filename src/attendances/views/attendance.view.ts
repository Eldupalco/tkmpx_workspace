import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaView } from '../../common/utils/pagination.util.js';

export class AttendanceSchedulesSummaryView {
  @ApiProperty({ example: 'Sample shiftName' })
  shiftName: string;

  @ApiProperty({ example: 1 })
  dayOfWeek: number;

  @ApiProperty({ example: 'Sample userId' })
  userId: string;
}

export class AttendanceUsersSummaryView {
  @ApiProperty({ example: 'Sample name' })
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Sample role' })
  role: string;
}

export class AttendanceView {
  @ApiProperty({ example: 'Sample id' })
  id: string;

  @ApiProperty({ example: 'Sample userId' })
  userId: string;

  @ApiProperty({ example: 'Sample date' })
  date: string;

  @ApiPropertyOptional({ example: '2026-10-29T00:00:00.000Z', nullable: true })
  amIn: Date | string | null;

  @ApiPropertyOptional({ example: '2026-10-29T00:00:00.000Z', nullable: true })
  amOut: Date | string | null;

  @ApiPropertyOptional({ example: '2026-10-29T00:00:00.000Z', nullable: true })
  pmIn: Date | string | null;

  @ApiPropertyOptional({ example: '2026-10-29T00:00:00.000Z', nullable: true })
  pmOut: Date | string | null;

  @ApiProperty({ example: 0 })
  lateMinutes: number;

  @ApiProperty({ example: 0 })
  undertimeMinutes: number;

  @ApiProperty({ example: 'Sample status' })
  status: string;

  @ApiProperty({ example: 'Sample notes' })
  notes: string;

  @ApiProperty({ example: '2026-10-28T12:00:00.000Z' })
  createdAt: Date | string;

  @ApiProperty({ example: '2026-10-28T12:00:00.000Z' })
  updatedAt: Date | string;

  @ApiProperty({ example: 'Sample scheduleId' })
  scheduleId: string;

  @ApiPropertyOptional({ type: AttendanceSchedulesSummaryView })
  schedules?: AttendanceSchedulesSummaryView | null;

  @ApiPropertyOptional({ type: AttendanceUsersSummaryView })
  users?: AttendanceUsersSummaryView | null;
}

export class PaginatedAttendanceView {
  @ApiProperty({ type: [AttendanceView] })
  data: AttendanceView[];

  @ApiProperty({ type: PaginationMetaView })
  meta: PaginationMetaView;
}
