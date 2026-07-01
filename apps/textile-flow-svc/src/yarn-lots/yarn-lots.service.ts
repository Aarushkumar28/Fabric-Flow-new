import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateYarnLotDto, UpdateYarnLotDto } from '@textile-flow/shared';
import { Prisma } from '@prisma/client';
import {
  toOldYarnLookupShape,
  yarnStatusFromInvoice,
} from '../common/adapters/workflow-status.adapter';

@Injectable()
export class YarnLotsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateYarnLotDto) {
    const bags = dto.noOfBags || 0;
    const bagWt = dto.bagWeight ?? 60;
    const totalWeight = bags * bagWt;
    const rate = dto.ratePerKg || 0;
    const taxable = totalWeight * rate;
    const cgstPct = dto.cgstRate ?? 2.5;
    const sgstPct = dto.sgstRate ?? 2.5;
    const cgstAmt = taxable * (cgstPct / 100);
    const sgstAmt = taxable * (sgstPct / 100);
    const totalCost = taxable + cgstAmt + sgstAmt;

    return this.prisma.yarnLot.create({
      data: {
        hfCode: dto.hfCode,
        purchaseOrderNo: dto.purchaseOrderNo,
        invoiceNo: dto.invoiceNo,
        status: yarnStatusFromInvoice(dto.invoiceNo),
        deliveryTo: dto.deliveryTo,
        millId: dto.millId,
        description: dto.description,
        count: dto.count,
        quality: dto.quality,
        noOfBags: bags,
        bagWeight: bagWt,
        totalWeight,
        availableWeight: totalWeight,
        ratePerKg: rate,
        totalCost,
        cgstRate: cgstPct,
        sgstRate: sgstPct,
        cgstAmount: cgstAmt,
        sgstAmount: sgstAmt,
      },
      include: { mill: true },
    });
  }

  async findAll(filters?: { hfCode?: string; knitterId?: number }) {
    const where: Prisma.YarnLotWhereInput = {};

    if (filters?.hfCode) {
      where.hfCode = { contains: filters.hfCode, mode: 'insensitive' };
    }

    if (filters?.knitterId) {
      return this.prisma.yarnLot.findMany({
        where: {
          knitterStocks: { some: { knitterId: filters.knitterId } },
          ...where,
        },
        include: {
          mill: true,
          knitterStocks: {
            where: { knitterId: filters.knitterId },
            select: {
              knitter: { select: { id: true, name: true } },
              receivedWeight: true,
              remainingWeight: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.yarnLot.findMany({
      where,
      include: {
        mill: true,
        knitterStocks: {
          include: {
            knitter: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const lot = await this.prisma.yarnLot.findUnique({
      where: { id },
      include: {
        mill: true,
        yarnReceipts: true,
        knitterStocks: { include: { knitter: true } },
      },
    });
    if (!lot) throw new NotFoundException('Yarn lot not found');
    return lot;
  }

  async update(id: number, dto: UpdateYarnLotDto) {
    const existing = await this.findOne(id);

    // Build typed update — no any
    const updateData: Prisma.YarnLotUpdateInput = {};

    // Map DTO fields explicitly
    if (dto.hfCode !== undefined) updateData.hfCode = dto.hfCode;
    if (dto.purchaseOrderNo !== undefined)
      updateData.purchaseOrderNo = dto.purchaseOrderNo;
    if (dto.invoiceNo !== undefined) updateData.invoiceNo = dto.invoiceNo;
    if (dto.deliveryTo !== undefined) updateData.deliveryTo = dto.deliveryTo;
    if (dto.millId !== undefined)
      updateData.mill = { connect: { id: dto.millId } };
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.count !== undefined) updateData.count = dto.count;
    if (dto.quality !== undefined) updateData.quality = dto.quality;
    if (dto.noOfBags !== undefined) updateData.noOfBags = dto.noOfBags;
    if (dto.bagWeight !== undefined) updateData.bagWeight = dto.bagWeight;
    if (dto.ratePerKg !== undefined) updateData.ratePerKg = dto.ratePerKg;
    if (dto.cgstRate !== undefined) updateData.cgstRate = dto.cgstRate;
    if (dto.sgstRate !== undefined) updateData.sgstRate = dto.sgstRate;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.invoiceNo !== undefined && dto.status === undefined) {
      updateData.status = yarnStatusFromInvoice(dto.invoiceNo);
    }

    // Recalculate weight if bags or bagWeight change
    if (dto.noOfBags !== undefined || dto.bagWeight !== undefined) {
      const bags = dto.noOfBags ?? existing.noOfBags ?? 0;
      const bagWt =
        dto.bagWeight ??
        (existing.bagWeight != null ? Number(existing.bagWeight) : 60);
      updateData.totalWeight = bags * bagWt;
    }

    // Recalculate taxes whenever totalWeight or rate changes
    const newWeight =
      updateData.totalWeight !== undefined
        ? (updateData.totalWeight as number)
        : existing.totalWeight;
    const rate =
      dto.ratePerKg !== undefined ? dto.ratePerKg : existing.ratePerKg;
    const taxable = newWeight * rate;
    const cgstPct =
      dto.cgstRate !== undefined ? dto.cgstRate : (existing.cgstRate ?? 2.5);
    const sgstPct =
      dto.sgstRate !== undefined ? dto.sgstRate : (existing.sgstRate ?? 2.5);
    updateData.cgstAmount = taxable * (cgstPct / 100);
    updateData.sgstAmount = taxable * (sgstPct / 100);
    updateData.totalCost =
      taxable + updateData.cgstAmount + updateData.sgstAmount;

    // If the lot was empty and now has weight, set it as available
    if (existing.totalWeight === 0 && newWeight > 0) {
      updateData.availableWeight = newWeight;
    }

    return this.prisma.yarnLot.update({
      where: { id },
      data: updateData,
      include: { mill: true },
    });
  }

  async remove(id: number) {
    const lot = await this.prisma.yarnLot.findUnique({
      where: { id },
      include: {
        knitterStocks: true,
        yarnReceipts: true,
        knittingYarnUsages: true,
        deliveryNotes: true,
        knitterPrograms: true,
      },
    });

    if (!lot) throw new NotFoundException('Yarn lot not found');

    // Fix #2: Prevent deletion of Yarn Lots with dependent records
    if (
      lot.knitterStocks.length > 0 ||
      lot.yarnReceipts.length > 0 ||
      lot.knittingYarnUsages.length > 0 ||
      lot.deliveryNotes.length > 0 ||
      lot.knitterPrograms.length > 0
    ) {
      throw new BadRequestException(
        'Cannot delete Yarn Lot with existing dependencies (stock, usage, notes, or programs)',
      );
    }

    return this.prisma.yarnLot.delete({ where: { id } });
  }

  async findByHfCode(hfCode: string) {
    const lots = await this.prisma.yarnLot.findMany({
      where: { hfCode: { equals: hfCode, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
    });

    return lots.map(toOldYarnLookupShape);
  }

  async findByPurchaseOrderNo(purchaseOrderNo: string) {
    const lots = await this.prisma.yarnLot.findMany({
      where: {
        purchaseOrderNo: { equals: purchaseOrderNo, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
    });

    return lots.map(toOldYarnLookupShape);
  }

  async listHfCodes() {
    const lots = await this.prisma.yarnLot.findMany({
      distinct: ['hfCode'],
      select: { hfCode: true },
      orderBy: { hfCode: 'asc' },
    });

    return lots.map((lot) => lot.hfCode);
  }

  async issue(id: number, knitterId: number, weight: number) {
    if (weight <= 0) {
      throw new BadRequestException('Issue weight must be greater than zero');
    }

    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.yarnLot.findUniqueOrThrow({ where: { id } });
      if (lot.availableWeight < weight) {
        throw new BadRequestException(
          `Insufficient inventory. Available: ${lot.availableWeight} kg, requested: ${weight} kg`,
        );
      }

      await tx.yarnLot.update({
        where: { id },
        data: { availableWeight: { decrement: weight } },
      });

      await tx.knitterStock.upsert({
        where: {
          knitterId_yarnLotId: {
            knitterId,
            yarnLotId: id,
          },
        },
        create: {
          knitterId,
          yarnLotId: id,
          receivedWeight: weight,
          remainingWeight: weight,
        },
        update: {
          receivedWeight: { increment: weight },
          remainingWeight: { increment: weight },
        },
      });

      await tx.auditLog.create({
        data: {
          tableName: 'yarn_lots',
          recordId: String(id),
          action: 'UPDATE',
          oldData: {
            availableWeight: lot.availableWeight,
          },
          newData: {
            issuedToKnitterId: knitterId,
            issuedWeight: weight,
            availableWeight: lot.availableWeight - weight,
          },
          performedBy: 'system',
        },
      });

      return tx.yarnLot.findUnique({
        where: { id },
        include: { mill: true },
      });
    });
  }
}
