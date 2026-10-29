import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Response,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AttendancesService } from '../services/attendances.service.js';
import { CreateAttendanceDto } from '../dto/create-attendance.dto.js';
import { UpdateAttendanceDto } from '../dto/update-attendance.dto.js';
import { QueryAttendanceDto } from '../dto/query-attendance.dto.js';
import {
  PunchActionDto,
  LeaveActionDto,
  TimesheetQueryDto,
} from '../dto/attendance-actions.dto.js';
import {
  AttendanceView,
  PaginatedAttendanceView,
} from '../views/attendance.view.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { resolveUserId } from '../../common/utils/request-user.util.js';

@ApiTags('Attendances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  // --- Specialized Workflow Endpoints ---

  @Get('today-status')
  @ApiOperation({ summary: 'Inspect punch state for today' })
  @ApiResponse({ status: 200, description: 'Current punch status for today' })
  getTodayStatus(@Request() req: any, @Query('userId') queryUserId?: string) {
    const targetUserId = resolveUserId(req.user, queryUserId);
    return this.attendancesService.getTodayStatus(targetUserId);
  }

  @Get('currently-in')
  @Roles('admin')
  @ApiOperation({ summary: 'List employees currently working right now (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of on-site staff' })
  getCurrentlyIn() {
    return this.attendancesService.getCurrentlyIn();
  }

  @Get('dashboard')
  @Roles('admin')
  @ApiOperation({ summary: 'Executive daily HR pulse metrics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Daily attendance pulse' })
  getDashboardMetrics() {
    return this.attendancesService.getDashboardMetrics();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get attendance summary statistics' })
  @ApiResponse({ status: 200, description: 'Attendance counts' })
  getSummary(@Request() req: any, @Query('userId') queryUserId?: string) {
    const targetUserId = resolveUserId(req.user, queryUserId, { allowAll: true });
    return this.attendancesService.getSummary(targetUserId);
  }

  @Get('timesheet')
  @ApiOperation({ summary: 'Calculated timesheet with hours worked & overtime' })
  @ApiResponse({ status: 200, description: 'Timesheet calculation' })
  getTimesheet(@Request() req: any, @Query() query: TimesheetQueryDto) {
    const targetUserId = resolveUserId(req.user, query.userId);
    return this.attendancesService.getTimesheet(
      targetUserId,
      query.startDate,
      query.endDate,
    );
  }

  @Get('export')
  @ApiOperation({ summary: 'Download attendance records as RFC-4180 CSV file' })
  async exportCsv(
    @Request() req: any,
    @Response() res: any,
    @Query('userId') queryUserId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const targetUserId = resolveUserId(req.user, queryUserId, { allowAll: true });
    const csvContent = await this.attendancesService.exportCsv(
      targetUserId,
      startDate,
      endDate,
    );

    res.header('Content-Type', 'text/csv');
    res.attachment(`attendance-export-${Date.now()}.csv`);
    return res.send(csvContent);
  }

  @Post('punch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record the next punch of the day (Morning In, Morning Out, Afternoon In, Afternoon Out)',
  })
  @ApiResponse({ status: 200, description: 'Punch recorded; returns the day record' })
  @ApiResponse({ status: 400, description: 'On leave, or all four punches already recorded' })
  @ApiResponse({ status: 409, description: 'Same punch submitted twice at once' })
  performPunch(@Request() req: any, @Body() dto: PunchActionDto) {
    const targetUserId = resolveUserId(req.user, dto.userId);
    return this.attendancesService.performPunch(targetUserId, dto.notes);
  }

  @Post('leave')
  @ApiOperation({ summary: 'Register employee leave or vacation' })
  @ApiResponse({ status: 201, description: 'Leave recorded' })
  recordLeave(@Request() req: any, @Body() dto: LeaveActionDto) {
    const targetUserId = resolveUserId(req.user, dto.userId);
    return this.attendancesService.recordLeave(
      targetUserId,
      dto.date,
      dto.status,
      dto.notes,
    );
  }

  // --- Standard CRUD Endpoints ---

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create manual attendance record (Admin backfill)' })
  @ApiResponse({ status: 201, description: 'Created successfully', type: AttendanceView })
  create(@Body() dto: CreateAttendanceDto) {
    return this.attendancesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated list of attendances' })
  @ApiResponse({ status: 200, description: 'Paginated records', type: PaginatedAttendanceView })
  findAll(@Query() query: QueryAttendanceDto, @Request() req: any) {
    if (req.user?.role !== 'admin') {
      query.userId = req.user.sub;
    }
    return this.attendancesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attendance by ID' })
  @ApiParam({ name: 'id', description: 'Attendance identifier' })
  @ApiResponse({ status: 200, description: 'Found record', type: AttendanceView })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const record = await this.attendancesService.findOne(id);
    if (req.user?.role !== 'admin' && record.userId !== req.user.sub) {
      throw new ForbiddenException('You can only view your own attendance records');
    }
    return record;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update attendance record (non-admins: own notes only)' })
  @ApiParam({ name: 'id', description: 'Attendance identifier' })
  @ApiResponse({ status: 200, description: 'Updated successfully', type: AttendanceView })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
    @Request() req: any,
  ) {
    if (req.user?.role !== 'admin') {
      const record = await this.attendancesService.findOne(id);
      if (record.userId !== req.user.sub) {
        throw new ForbiddenException('You can only update your own attendance records');
      }
      // Punch times, status and ownership are admin-controlled to keep timesheets trustworthy
      const restricted = Object.entries(dto)
        .filter(([key, value]) => key !== 'notes' && value !== undefined)
        .map(([key]) => key);
      if (restricted.length > 0) {
        throw new ForbiddenException(
          `Only admins can change: ${restricted.join(', ')}`,
        );
      }
    }
    return this.attendancesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete attendance record (Admin only)' })
  @ApiParam({ name: 'id', description: 'Attendance identifier' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  remove(@Param('id') id: string) {
    return this.attendancesService.remove(id);
  }
}
