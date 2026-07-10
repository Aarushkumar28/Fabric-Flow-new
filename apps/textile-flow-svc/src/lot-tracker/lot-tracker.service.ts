import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LotStatus, WorkflowStatus } from '@textile-flow/shared';
import { InventoryService } from '../inventory/inventory.service';

const DELAY_THRESHOLD_DAYS = 7;

@Injectable()
export class LotTrackerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Evaluates and persists the current status of a lot by aggregating
   * knitting, dyeing, and compacting records.
   * NOTE: Knitting is linked via KnittingLot.lotNo, not Knitting.lotNo (which does not exist).
   */
  async evaluateLot(lotNo: string) {
    if (!lotNo) {
      throw new BadRequestException('Lot number is required');
    }

    // Knitting records are found via KnittingLot (which holds the lotNo)
    const knittingLots = await this.prisma.knittingLot.findMany({
      where: { lotNo },
      include: { knitting: true },
      orderBy: { createdAt: 'asc' },
    });
    const knittings = knittingLots.map((kl) => kl.knitting);

    // Dyeing records have lotNo directly
    const dyeings = await this.prisma.dyeing.findMany({
      where: { lotNo },
      orderBy: { createdAt: 'asc' },
    });

    // Compactings are linked via their dyeing record's lotNo
    const compactings = await this.prisma.compacting.findMany({
      where: { dyeing: { lotNo } },
      include: { dyeing: true },
      orderBy: { createdAt: 'asc' },
    });

    // ---- Determine current status ----
    let currentStatus: string = LotStatus.PENDING;
    let activeStage: string | null = null;

    if (knittings.length > 0) {
      currentStatus = LotStatus.IN_KNITTING;
      activeStage = 'KNITTING';
    }
    if (dyeings.length > 0) {
      currentStatus = LotStatus.IN_DYEING;
      activeStage = 'DYEING';
    }
    if (compactings.length > 0) {
      currentStatus = LotStatus.IN_COMPACTING;
      activeStage = 'COMPACTING';
    }

    // ---- Weight calculations ----
    const totalWeight = knittings.reduce(
      (sum, k) => sum + Number(k.receivedWeight ?? k.greyFabricWeight ?? 0),
      0,
    );

    const completedWeight = compactings.reduce(
      (sum, c) => sum + Number(c.finalWeight ?? 0),
      0,
    );

    const balanceWeight = Number(
      Math.max(totalWeight - completedWeight, 0).toFixed(3),
    );

    let completionPercent = 0;
    if (totalWeight > 0) {
      completionPercent = Number(
        Math.min((completedWeight / totalWeight) * 100, 100).toFixed(2),
      );
    }

    // ---- Inventory-aware balance checks (for COMPLETED gate) ----
    const [greyBalance, dyedBalance] = await Promise.all([
      this.inventoryService.getLotBalance(lotNo, 'GREY'),
      this.inventoryService.getLotBalance(lotNo, 'DYED'),
    ]);
    const hasRemainingBalance = greyBalance > 0 || dyedBalance > 0;

    // ---- Partial / Completed detection ----
    const completedCompactings = compactings.filter(
      (c) => c.status === (WorkflowStatus.COMPLETED as string),
    );

    if (completedWeight > 0 && completedWeight < totalWeight) {
      currentStatus = LotStatus.PARTIAL;
    }

    // Only mark COMPLETED when inventory is fully consumed
    if (
      compactings.length > 0 &&
      completedCompactings.length === compactings.length &&
      dyeings.every((d) => d.status === (WorkflowStatus.COMPLETED as string)) &&
      !hasRemainingBalance
    ) {
      currentStatus = LotStatus.COMPLETED;
      activeStage = 'COMPLETED';
    }

    // ---- Delay detection ----
    const latestDates = [
      ...knittings.map((x) => x.updatedAt),
      ...dyeings.map((x) => x.updatedAt),
      ...compactings.map((x) => x.updatedAt),
    ].filter(Boolean);

    const latestActivity =
      latestDates.length > 0
        ? latestDates.sort((a, b) => b.getTime() - a.getTime())[0]
        : null;

    const delayed =
      currentStatus !== (LotStatus.COMPLETED as string) &&
      currentStatus !== (LotStatus.CANCELLED as string) &&
      latestActivity !== null
        ? this.isDelayed(latestActivity)
        : false;

    // ---- Status-change event logging ----
    const existing = await this.prisma.lotTracker.findUnique({
      where: { lotNo },
    });

    if (existing?.currentStatus !== currentStatus) {
      await this.createLotEvent({
        lotNo,
        eventType: 'STATUS_CHANGED',
        previousStatus: existing?.currentStatus,
        newStatus: currentStatus,
      });
    }

    // ---- Upsert the tracker record ----
    return this.prisma.lotTracker.upsert({
      where: { lotNo },
      create: {
        lotNo,
        currentStatus,
        activeStage,
        completionPercent,
        totalWeight,
        completedWeight,
        balanceWeight,
        delayed,
        startedAt: knittingLots[0]?.createdAt ?? null,
        completedAt:
          currentStatus === (LotStatus.COMPLETED as string) ? new Date() : null,
        lastActivityAt: latestActivity,
      },
      update: {
        currentStatus,
        activeStage,
        completionPercent,
        totalWeight,
        completedWeight,
        balanceWeight,
        delayed,
        completedAt:
          currentStatus === (LotStatus.COMPLETED as string) ? new Date() : null,
        lastActivityAt: latestActivity,
      },
    });
  }

  private isDelayed(lastActivity: Date): boolean {
    const now = new Date();
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays > DELAY_THRESHOLD_DAYS;
  }

  /** Log a lifecycle event for a lot */
  async createLotEvent({
    lotNo,
    eventType,
    previousStatus,
    newStatus,
    remarks,
  }: {
    lotNo: string;
    eventType: string;
    previousStatus?: string;
    newStatus?: string;
    remarks?: string;
  }) {
    return this.prisma.lotEvent.create({
      data: { lotNo, eventType, previousStatus, newStatus, remarks },
    });
  }

  /** Return paginated lot tracker records with optional filtering */
  async getAllLots({
    page = 1,
    limit = 20,
    status,
    delayed,
  }: {
    page?: number;
    limit?: number;
    status?: string;
    delayed?: boolean;
  }) {
    const where: {
      currentStatus?: string;
      delayed?: boolean;
    } = {};

    if (status) {
      where.currentStatus = status;
    }
    if (delayed !== undefined) {
      where.delayed = delayed;
    }

    const [data, total] = await Promise.all([
      this.prisma.lotTracker.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lotTracker.count({ where }),
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

  /** Return a single lot tracker by lotNo */
  async findByLotNo(lotNo: string) {
    const tracker = await this.prisma.lotTracker.findUnique({
      where: { lotNo },
    });
    if (!tracker)
      throw new NotFoundException(`Lot tracker for ${lotNo} not found`);
    return tracker;
  }

  /** Return all delayed lots */
  async findDelayed() {
    return this.prisma.lotTracker.findMany({
      where: { delayed: true },
      orderBy: { lastActivityAt: 'asc' },
    });
  }

  /** Return all lots currently in a given stage */
  async findByStage(stage: string) {
    return this.prisma.lotTracker.findMany({
      where: { activeStage: stage.toUpperCase() },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Return lot lifecycle event history */
  async getLotHistory(lotNo: string) {
    return this.prisma.lotEvent.findMany({
      where: { lotNo },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Dashboard summary: counts + global inventory balances */
  async getDashboardSummary() {
    const [
      totalLots,
      pendingLots,
      completedLots,
      delayedLots,
      activeLots,
      totalGreyBalance,
      totalDyedBalance,
      totalCompactBalance,
    ] = await Promise.all([
      this.prisma.lotTracker.count(),
      this.prisma.lotTracker.count({
        where: { currentStatus: LotStatus.PENDING },
      }),
      this.prisma.lotTracker.count({
        where: { currentStatus: LotStatus.COMPLETED },
      }),
      this.prisma.lotTracker.count({ where: { delayed: true } }),
      this.prisma.lotTracker.count({
        where: {
          currentStatus: {
            in: [
              LotStatus.IN_KNITTING as string,
              LotStatus.IN_DYEING as string,
              LotStatus.IN_COMPACTING as string,
              LotStatus.PARTIAL as string,
            ],
          },
        },
      }),
      this.inventoryService.getCurrentBalance('GREY'),
      this.inventoryService.getCurrentBalance('DYED'),
      this.inventoryService.getCurrentBalance('COMPACT'),
    ]);

    return {
      totalLots,
      pendingLots,
      completedLots,
      delayedLots,
      activeLots,
      totalGreyBalance,
      totalDyedBalance,
      totalCompactBalance,
    };
  }

  /** Re-evaluate every known KnittingLot to bring all trackers up to date */
  async reconcileAllLots() {
    const lots = await this.prisma.knittingLot.findMany({
      distinct: ['lotNo'],
      select: { lotNo: true },
    });

    for (const lot of lots) {
      await this.evaluateLot(lot.lotNo);
    }

    return { reconciled: lots.length };
  }

  /**
   * Delete tracker records whose lotNo no longer exists in KnittingLot.
   * Keeps the database free from stale entries after data corrections.
   */
  async cleanupOrphanTrackers() {
    const trackers = await this.prisma.lotTracker.findMany({
      select: { id: true, lotNo: true },
    });

    let deleted = 0;

    for (const tracker of trackers) {
      const exists = await this.prisma.knittingLot.findFirst({
        where: { lotNo: tracker.lotNo },
      });

      if (!exists) {
        await this.prisma.lotTracker.delete({ where: { id: tracker.id } });
        deleted++;
      }
    }

    return { deleted };
  }
}
