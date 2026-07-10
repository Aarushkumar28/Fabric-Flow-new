import { BadRequestException, Injectable } from '@nestjs/common';

import {
  ProductionPlanStatus,
  ProductionPriority,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { LotTrackerService } from '../lot-tracker/lot-tracker.service';

import { CreateProductionPlanDto } from './dto/create-production-plan.dto';

import { UpdateProductionPlanDto } from './dto/update-production-plan.dto';

@Injectable()
export class ProductionPlanningService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly lotTrackerService: LotTrackerService,
  ) {}

  async generatePlanNo() {
    const count = await this.prisma.productionPlan.count();

    return `PLAN-${new Date().getFullYear()}-${String(count + 1).padStart(
      4,
      '0',
    )}`;
  }

  async createPlan(dto: CreateProductionPlanDto) {
    const existingLot = await this.prisma.knittingLot.findFirst({
      where: {
        lotNo: dto.lotNo,
      },
    });

    if (!existingLot) {
      throw new BadRequestException('Invalid lot number');
    }

    const delayed = new Date(dto.plannedDate).getTime() < Date.now();

    if (!Object.values(ProductionPriority).includes(dto.priority)) {
      throw new BadRequestException('Invalid priority');
    }

    const created = await this.prisma.productionPlan.create({
      data: {
        planNo: await this.generatePlanNo(),

        lotNo: dto.lotNo,

        stage: dto.stage,

        plannedWeight: dto.plannedWeight,

        plannedDate: new Date(dto.plannedDate),

        priority: dto.priority,

        remarks: dto.remarks,

        delayed,

        status: ProductionPlanStatus.PENDING,
      },
    });

    await this.createProductionReservation({
      lotNo: dto.lotNo,

      quantity: dto.plannedWeight,

      productionPlanId: created.id,
    });

    await this.logEvent({
      productionPlanId: created.id,

      eventType: 'PLAN_CREATED',

      message: `Production plan ${created.planNo} created`,
    });

    return created;
  }

  async updatePlan(id: number, dto: UpdateProductionPlanDto) {
    const existing = await this.prisma.productionPlan.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new BadRequestException('Production plan not found');
    }

    const updated = await this.prisma.productionPlan.update({
      where: { id },

      data: {
        status: dto.status as ProductionPlanStatus,

        completedWeight: dto.completedWeight,

        remarks: dto.remarks,

        actualStartDate:
          dto.status === ProductionPlanStatus.IN_PROGRESS
            ? new Date()
            : existing.actualStartDate,

        actualEndDate:
          dto.status === ProductionPlanStatus.COMPLETED
            ? new Date()
            : existing.actualEndDate,
      },
    });

    await this.lotTrackerService.evaluateLot(updated.lotNo).catch(() => {});

    return updated;
  }

  async refreshDelayedStatuses() {
    const today = new Date();

    await this.prisma.productionPlan.updateMany({
      where: {
        plannedDate: {
          lt: today,
        },

        status: {
          not: ProductionPlanStatus.COMPLETED,
        },
      },

      data: {
        delayed: true,
      },
    });

    await this.prisma.productionPlan.updateMany({
      where: {
        plannedDate: {
          gte: today,
        },
      },

      data: {
        delayed: false,
      },
    });
  }

  async getTodayPlans() {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);

    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.productionPlan.findMany({
      where: {
        plannedDate: {
          gte: today,

          lt: tomorrow,
        },
      },

      orderBy: {
        priority: 'desc',
      },
    });
  }

  async getDelayedPlans() {
    await this.refreshDelayedStatuses();

    return this.prisma.productionPlan.findMany({
      where: {
        delayed: true,

        status: {
          not: ProductionPlanStatus.COMPLETED,
        },
      },

      orderBy: {
        plannedDate: 'asc',
      },
    });
  }

  async getPlans({
    page = 1,

    limit = 20,

    status,

    stage,
  }: {
    page?: number;

    limit?: number;

    status?: string;

    stage?: string;
  }) {
    const where: Prisma.ProductionPlanWhereInput = {};

    if (status) {
      where.status = status as ProductionPlanStatus;
    }

    if (stage) {
      where.stage = stage;
    }

    const [data, total] = await Promise.all([
      this.prisma.productionPlan.findMany({
        where,

        orderBy: {
          plannedDate: 'desc',
        },

        skip: (page - 1) * limit,

        take: limit,
      }),

      this.prisma.productionPlan.count({
        where,
      }),
    ]);

    return {
      data,

      pagination: {
        total,

        page,

        limit,

        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async cancelPlan(id: number) {
    const plan = await this.prisma.productionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new BadRequestException('Production plan not found');
    }

    if (plan.status === ProductionPlanStatus.COMPLETED) {
      throw new BadRequestException('Completed plan cannot be cancelled');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      return tx.productionPlan.update({
        where: { id },

        data: {
          status: ProductionPlanStatus.CANCELLED,
        },
      });
    });

    await this.logEvent({
      productionPlanId: id,

      eventType: 'PLAN_CANCELLED',

      message: `Production plan cancelled`,
    });

    return result;
  }

  async logEvent({
    productionPlanId,
    eventType,
    message,
    metadata,
  }: {
    productionPlanId?: number;
    eventType: string;
    message: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.productionEvent.create({
      data: {
        productionPlanId,
        eventType,
        message,
        metadata,
      },
    });
  }

  async createProductionReservation({
    lotNo,
    quantity,
    productionPlanId,
  }: {
    lotNo: string;
    quantity: number;
    productionPlanId: number;
  }) {
    const latest = await this.prisma.inventoryLedger.findFirst({
      where: { itemType: 'GREY' },
      orderBy: { createdAt: 'desc' },
    });
    const balanceWeight = latest?.balanceWeight ?? 0;

    return this.prisma.inventoryLedger.create({
      data: {
        lotNo,
        transactionType: 'RESERVED',
        quantity,
        referenceType: 'PRODUCTION_PLAN',
        referenceId: productionPlanId,
        remarks: 'Reserved for production planning',

        // Required fields
        entityType: 'PRODUCTION_PLAN',
        entityId: productionPlanId,
        itemType: 'GREY',
        balanceWeight,
      },
    });
  }

  async completeProductionInventory({
    lotNo,
    quantity,
    productionPlanId,
  }: {
    lotNo: string;
    quantity: number;
    productionPlanId: number;
  }) {
    const latest = await this.prisma.inventoryLedger.findFirst({
      where: { itemType: 'GREY' },
      orderBy: { createdAt: 'desc' },
    });
    const currentBalance = latest?.balanceWeight ?? 0;
    const balanceWeight = Number((currentBalance - quantity).toFixed(3));

    return this.prisma.inventoryLedger.create({
      data: {
        lotNo,
        transactionType: 'CONSUMED',
        quantity,
        referenceType: 'PRODUCTION_COMPLETION',
        referenceId: productionPlanId,
        remarks: 'Production completed inventory consumption',

        // Required fields
        entityType: 'PRODUCTION_COMPLETION',
        entityId: productionPlanId,
        itemType: 'GREY',
        outwardWeight: quantity,
        balanceWeight,
      },
    });
  }

  async getEvents() {
    return this.prisma.productionEvent.findMany({
      orderBy: {
        createdAt: 'desc',
      },

      take: 100,
    });
  }

  async getSummary() {
    const [
      totalPlans,

      completedPlans,

      delayedPlans,

      inProgressPlans,

      totalWeight,

      completedWeight,
    ] = await Promise.all([
      this.prisma.productionPlan.count(),

      this.prisma.productionPlan.count({
        where: {
          status: ProductionPlanStatus.COMPLETED,
        },
      }),

      this.prisma.productionPlan.count({
        where: {
          delayed: true,
        },
      }),

      this.prisma.productionPlan.count({
        where: {
          status: ProductionPlanStatus.IN_PROGRESS,
        },
      }),

      this.prisma.productionPlan.aggregate({
        _sum: {
          plannedWeight: true,
        },
      }),

      this.prisma.productionPlan.aggregate({
        _sum: {
          completedWeight: true,
        },
      }),
    ]);

    const planned = Number(totalWeight._sum.plannedWeight ?? 0);

    const completed = Number(completedWeight._sum.completedWeight ?? 0);

    return {
      totalPlans,

      completedPlans,

      delayedPlans,

      inProgressPlans,

      plannedWeight: planned,

      completedWeight: completed,

      efficiency:
        planned > 0 ? Number(((completed / planned) * 100).toFixed(2)) : 0,
    };
  }
}
