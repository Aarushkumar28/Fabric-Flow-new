import {
  Controller,
  Post,
  Get,
  Body,
  Query,
} from '@nestjs/common';
import { ActivityLogsService, SummaryResponse, PaginatedLogs } from './activity-logs.service';
import { BulkImportDto } from './dto/create-activity-log.dto';

@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Post('bulk-import')
  bulkImport(@Body() dto: BulkImportDto): Promise<{ imported: number }> {
    return this.activityLogsService.bulkImport(dto);
  }

  @Get('summary')
  getSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<SummaryResponse> {
    return this.activityLogsService.getSummary(from, to);
  }

  @Get()
  getAll(
    @Query('user') user?: string,
    @Query('module') module?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
  ): Promise<PaginatedLogs> {
    return this.activityLogsService.getAll({
      user,
      module,
      from,
      to,
      page: page ? parseInt(page, 10) : 1,
    });
  }
}
