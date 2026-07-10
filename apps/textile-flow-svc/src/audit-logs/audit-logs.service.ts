import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// ---- DTO for creating an audit log entry ----
export interface CreateAuditLogDto {
  tableName: string;
  recordId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  performedBy?: string;
}

/** Convert a plain object (or null) to a value Prisma accepts for a Json? field. */
function toJsonField(
  value: Record<string, unknown> | null | undefined,
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue {
  return value == null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.auditLog.findMany({
      orderBy: { performedAt: 'desc' },
      take: 500,
    });
  }

  create(data: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        tableName: data.tableName,
        recordId: data.recordId,
        action: data.action,
        oldData: toJsonField(data.oldData),
        newData: toJsonField(data.newData),
        performedBy: data.performedBy ?? 'system',
      },
    });
  }
}
