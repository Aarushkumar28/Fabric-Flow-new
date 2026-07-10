import { Injectable, Logger } from '@nestjs/common';
import { ActivityLog } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BulkImportDto } from './dto/create-activity-log.dto';
import type { Prisma } from '@prisma/client';

export interface SummaryResponse {
  totalEvents: number;
  uniqueUsers: string[];
  activeDays: number;
  eventsByModule: { module: string; count: number }[];
  eventsByUser: { user: string; count: number }[];
  eventsByDay: { date: string; count: number }[];
  recentLogs: ActivityLog[];
}

export interface PaginatedLogs {
  data: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
}

interface GetAllFilters {
  user?: string;
  module?: string;
  from?: string;
  to?: string;
  page?: number;
}

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fire-and-forget live activity logger.
   * Call with `void this.activityLogger.log(...)` — never awaited, never throws.
   */
  log(params: {
    user: string;
    action: string;
    module: string;
    details?: string;
  }): void {
    const client = this.prisma as unknown as Prisma.TransactionClient;
    client.activityLog
      .create({
        data: {
          date: new Date(),
          user: params.user,
          action: params.action,
          module: params.module,
          details: params.details,
          source: 'LIVE',
        },
      })
      .catch((err: unknown) => {
        this.logger.warn(
          `Activity log failed [${params.module}/${params.action}]: ${String(err)}`,
        );
      });
  }

  async bulkImport(dto: BulkImportDto): Promise<{ imported: number }> {
    const result = await (this.prisma as unknown as Prisma.TransactionClient).activityLog.createMany({
      data: dto.logs.map((log) => ({
        date: new Date(log.date),
        user: log.user,
        action: log.action,
        module: log.module,
        details: log.details,
        source: log.source ?? 'IMPORT',
      })),
      skipDuplicates: true,
    });
    return { imported: result.count };
  }

  async getSummary(from?: string, to?: string): Promise<SummaryResponse> {
    const where: Prisma.ActivityLogWhereInput = {};
    if (from || to) {
      where.date = {};
      if (from) (where.date as Prisma.DateTimeFilter).gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        (where.date as Prisma.DateTimeFilter).lte = toDate;
      }
    }

    const all = await (this.prisma as unknown as Prisma.TransactionClient).activityLog.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const totalEvents = all.length;
    const uniqueUsers = [...new Set(all.map((l) => l.user))];
    const activeDays = new Set(all.map((l) => l.date.toISOString().slice(0, 10))).size;

    const moduleMap = new Map<string, number>();
    for (const l of all) {
      moduleMap.set(l.module, (moduleMap.get(l.module) ?? 0) + 1);
    }
    const eventsByModule = [...moduleMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([mod, count]) => ({ module: mod, count }));

    const userMap = new Map<string, number>();
    for (const l of all) {
      userMap.set(l.user, (userMap.get(l.user) ?? 0) + 1);
    }
    const eventsByUser = [...userMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([user, count]) => ({ user, count }));

    const dayMap = new Map<string, number>();
    for (const l of all) {
      const day = l.date.toISOString().slice(0, 10);
      dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
    }
    const eventsByDay = [...dayMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return {
      totalEvents,
      uniqueUsers,
      activeDays,
      eventsByModule,
      eventsByUser,
      eventsByDay,
      recentLogs: all.slice(0, 50),
    };
  }

  async getAll(filters: GetAllFilters): Promise<PaginatedLogs> {
    const page = filters.page ?? 1;
    const pageSize = 50;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ActivityLogWhereInput = {};
    if (filters.user) {
      where.user = { contains: filters.user, mode: 'insensitive' };
    }
    if (filters.module) {
      where.module = filters.module;
    }
    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) (where.date as Prisma.DateTimeFilter).gte = new Date(filters.from);
      if (filters.to) {
        const toDate = new Date(filters.to);
        toDate.setHours(23, 59, 59, 999);
        (where.date as Prisma.DateTimeFilter).lte = toDate;
      }
    }

    const client = this.prisma as unknown as Prisma.TransactionClient;
    const [data, total] = await Promise.all([
      client.activityLog.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: pageSize,
      }),
      client.activityLog.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }
}
