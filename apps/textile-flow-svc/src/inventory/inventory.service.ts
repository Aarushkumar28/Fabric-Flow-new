import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async postInventoryMovement(
    {
      entityType,
      entityId,
      itemType,
      inwardWeight,
      outwardWeight,
      referenceNo,
      lotNo,
      stage,
      remarks,
    }: {
      entityType: string;
      entityId: number;
      itemType: string;
      inwardWeight?: number;
      outwardWeight?: number;
      referenceNo?: string;
      lotNo?: string;
      stage?: string;
      remarks?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const run = async (client: Prisma.TransactionClient | PrismaService) => {
      const latest = await client.inventoryLedger.findFirst({
        where: {
          itemType,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const currentBalance = latest?.balanceWeight ?? 0;
      const inward = inwardWeight ?? 0;
      const outward = outwardWeight ?? 0;

      if (outward > currentBalance) {
        throw new BadRequestException(
          `Insufficient inventory balance for ${itemType}`,
        );
      }

      if (lotNo) {
        const lotEntries = await client.inventoryLedger.findMany({
          where: {
            lotNo,
            itemType,
          },
        });

        let lotBalance = 0;
        for (const row of lotEntries) {
          lotBalance += row.inwardWeight ?? 0;
          lotBalance -= row.outwardWeight ?? 0;
        }

        if (outward > lotBalance) {
          throw new BadRequestException(
            `Lot ${lotNo} has insufficient balance`,
          );
        }
      }

      const balanceWeight = Number(
        (currentBalance + inward - outward).toFixed(3),
      );

      return client.inventoryLedger.create({
        data: {
          entityType,
          entityId,
          itemType,
          inwardWeight,
          outwardWeight,
          balanceWeight,
          referenceNo,
          lotNo,
          stage,
          remarks,
        },
      });
    };

    if (tx) {
      return run(tx);
    } else {
      return this.prisma.$transaction(async (innerTx) => run(innerTx));
    }
  }

  async getCurrentBalance(
    itemType: string,
    client?: Prisma.TransactionClient | PrismaService,
  ): Promise<number> {
    const dbClient = client || this.prisma;
    const latest = await dbClient.inventoryLedger.findFirst({
      where: { itemType },
      orderBy: { createdAt: 'desc' },
    });

    return latest?.balanceWeight ?? 0;
  }

  async getLotBalance(lotNo: string, itemType?: string) {
    const where: Prisma.InventoryLedgerWhereInput = {
      lotNo,
    };

    if (itemType) {
      where.itemType = itemType;
    }

    const ledger = await this.prisma.inventoryLedger.findMany({
      where,
      orderBy: {
        createdAt: 'asc',
      },
    });

    let balance = 0;
    for (const row of ledger) {
      balance += row.inwardWeight ?? 0;
      balance -= row.outwardWeight ?? 0;
    }

    return Number(balance.toFixed(3));
  }

  async getStageBalance(stage: string) {
    const entries = await this.prisma.inventoryLedger.findMany({
      where: {
        stage,
      },
    });

    let balance = 0;
    for (const row of entries) {
      balance += row.inwardWeight ?? 0;
      balance -= row.outwardWeight ?? 0;
    }

    return Number(balance.toFixed(3));
  }

  async getInventorySummary() {
    const [yarn, grey, dyed, compact] = await Promise.all([
      this.getCurrentBalance('YARN'),
      this.getCurrentBalance('GREY'),
      this.getCurrentBalance('DYED'),
      this.getCurrentBalance('COMPACT'),
    ]);

    return {
      yarn,
      grey,
      dyed,
      compact,
    };
  }

  async getInventoryHistory({
    page = 1,
    limit = 20,
    itemType,
    lotNo,
  }: {
    page?: number;
    limit?: number;
    itemType?: string;
    lotNo?: string;
  }) {
    const where: Prisma.InventoryLedgerWhereInput = {};

    if (itemType) {
      where.itemType = itemType;
    }

    if (lotNo) {
      where.lotNo = lotNo;
    }

    const [data, total] = await Promise.all([
      this.prisma.inventoryLedger.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inventoryLedger.count({
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

  async reconcileInventory() {
    const ledgers = await this.prisma.inventoryLedger.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });

    const balances: Record<string, number> = {};
    for (const row of ledgers) {
      if (!balances[row.itemType]) {
        balances[row.itemType] = 0;
      }
      balances[row.itemType] += row.inwardWeight ?? 0;
      balances[row.itemType] -= row.outwardWeight ?? 0;
    }

    return balances;
  }

  async createDailySnapshot() {
    const itemTypes = ['YARN', 'GREY', 'DYED', 'COMPACT', 'LOSS'];

    for (const itemType of itemTypes) {
      const balance = await this.getCurrentBalance(itemType);

      await this.prisma.inventorySnapshot.create({
        data: {
          snapshotDate: new Date(),
          itemType,
          balanceWeight: balance,
        },
      });
    }

    return {
      success: true,
    };
  }
}
