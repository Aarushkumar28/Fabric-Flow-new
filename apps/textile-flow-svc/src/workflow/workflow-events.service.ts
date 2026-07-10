import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkflowEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    entityType: string;
    entityId: number;
    event: string;
    oldStatus?: string;
    newStatus?: string;
  }) {
    return this.prisma.workflowEvent.create({
      data,
    });
  }
}
