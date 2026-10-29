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
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SchedulesService } from '../services/schedules.service.js';
import { CreateScheduleDto } from '../dto/create-schedule.dto.js';
import { UpdateScheduleDto } from '../dto/update-schedule.dto.js';
import { QueryScheduleDto } from '../dto/query-schedule.dto.js';
import { BulkScheduleDto, BulkUsersScheduleDto } from '../dto/bulk-schedule.dto.js';
import { ScheduleView, PaginatedScheduleView } from '../views/schedule.view.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';

@ApiTags('Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  // --- Specialized Workflow Endpoints ---

  @Get('my-schedule')
  @ApiOperation({ summary: 'Display weekly shifts (Mon-Sun) for logged-in user' })
  @ApiResponse({ status: 200, description: 'Weekly shift roster with day names' })
  getMySchedule(@Request() req: any, @Query('userId') queryUserId?: string) {
    const targetUserId =
      req.user?.role === 'admin' && queryUserId ? queryUserId : req.user.sub;
    return this.schedulesService.getMySchedule(targetUserId);
  }

  @Get('today')
  @ApiOperation({ summary: 'Display shift hours for today' })
  @ApiResponse({ status: 200, description: "Today's expected shift" })
  getTodaySchedule(@Request() req: any, @Query('userId') queryUserId?: string) {
    const targetUserId =
      req.user?.role === 'admin' && queryUserId ? queryUserId : req.user.sub;
    return this.schedulesService.getTodaySchedule(targetUserId);
  }

  @Post('bulk')
  @Roles('admin')
  @ApiOperation({ summary: 'Bulk assign recurring weekly shifts for a single user (Admin only)' })
  @ApiResponse({ status: 201, description: 'Weekly shifts upserted' })
  bulkAssign(@Body() dto: BulkScheduleDto) {
    return this.schedulesService.bulkAssign(dto);
  }

  @Post('bulk-users')
  @Roles('admin')
  @ApiOperation({ summary: 'Bulk assign recurring weekly shifts across multiple users (Admin only)' })
  @ApiResponse({ status: 201, description: 'Cohort shifts upserted' })
  bulkUsersAssign(@Body() dto: BulkUsersScheduleDto) {
    return this.schedulesService.bulkUsersAssign(dto);
  }

  // --- Standard CRUD Endpoints ---

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create / assign a new schedule (Admin only)' })
  @ApiResponse({ status: 201, description: 'Created successfully', type: ScheduleView })
  @ApiResponse({ status: 409, description: 'Unique constraint conflict' })
  create(@Body() dto: CreateScheduleDto) {
    return this.schedulesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated list of schedules' })
  @ApiResponse({ status: 200, description: 'Paginated records', type: PaginatedScheduleView })
  findAll(@Query() query: QueryScheduleDto, @Request() req: any) {
    if (req.user?.role !== 'admin') {
      query.userId = req.user.sub;
    }
    return this.schedulesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a schedule by ID' })
  @ApiParam({ name: 'id', description: 'Schedule identifier' })
  @ApiResponse({ status: 200, description: 'Found record', type: ScheduleView })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const record = await this.schedulesService.findOne(id);
    if (req.user?.role !== 'admin' && record.userId !== req.user.sub) {
      throw new ForbiddenException('You can only view your own schedule');
    }
    return record;
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update schedule hours/status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Schedule identifier' })
  @ApiResponse({ status: 200, description: 'Updated successfully', type: ScheduleView })
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.schedulesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete schedule assignment (Admin only)' })
  @ApiParam({ name: 'id', description: 'Schedule identifier' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }
}
