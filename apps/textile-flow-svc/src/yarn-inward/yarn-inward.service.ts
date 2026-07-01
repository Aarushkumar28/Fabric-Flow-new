import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateYarnInwardDto, UpdateYarnInwardDto } from '@textile-flow/shared';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { yarnStatusFromInvoice } from '../common/adapters/workflow-status.adapter';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class YarnInwardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  create(dto: CreateYarnInwardDto) {
    return this.prisma.$transaction(async (tx) => {
      const bags = dto.numBags ?? 0;
      const bagWeight = dto.bagWeight ?? 60;
      const totalWeight = bags * bagWeight;
      if (totalWeight <= 0) {
        throw new BadRequestException(
          'Total yarn weight must be greater than zero',
        );
      }

      const rate = dto.ratePerKg ?? 0;
      const taxable = totalWeight * rate;
      const cgstRate = dto.cgstRate ?? 2.5;
      const sgstRate = dto.sgstRate ?? 2.5;
      const cgstAmount = taxable * (cgstRate / 100);
      const sgstAmount = taxable * (sgstRate / 100);
      const totalCost = taxable + cgstAmount + sgstAmount;

      const inward = await tx.yarnInward.create({
        data: {
          receiptDate: dto.receiptDate ? new Date(dto.receiptDate) : new Date(),
          millId: dto.millId,
          deliveryKnitterId: dto.deliveryKnitterId,
          hfBatch: dto.hfBatch,
          yarnCount: dto.yarnCount,
          yarnQuality: dto.yarnQuality,
          rlVl: dto.rlVl,
          numBags: bags,
          bagWeight,
          totalWeight,
          ratePerKg: rate,
          cgstRate,
          sgstRate,
          cgstAmount,
          sgstAmount,
          totalCost,
          purchaseAccount: dto.purchaseAccount,
          remarks: dto.remarks,
          purchaseOrderId: dto.purchaseOrderId ?? null,
          millInvoiceNo: dto.millInvoiceNo ?? null,
          millDcNo: dto.millDcNo ?? null,
          receivedWeight: dto.receivedWeight ?? null,
        },
      });

      const yarnLot = await tx.yarnLot.create({
        data: {
          hfCode: dto.hfBatch ?? `YI-${inward.id}`,
          yarnInwardId: inward.id,
          millId: dto.millId,
          deliveryTo: String(dto.deliveryKnitterId),
          description: dto.yarnQuality,
          count: dto.yarnCount,
          quality: dto.yarnQuality,
          status: yarnStatusFromInvoice(dto.hfBatch),
          ratePerKg: rate,
          totalWeight,
          totalCost,
          availableWeight: 0,
          noOfBags: bags,
          bagWeight,
          cgstRate,
          sgstRate,
          cgstAmount,
          sgstAmount,
        },
      });

      await tx.knitterStock.upsert({
        where: {
          knitterId_yarnLotId: {
            knitterId: dto.deliveryKnitterId,
            yarnLotId: yarnLot.id,
          },
        },
        create: {
          knitterId: dto.deliveryKnitterId,
          yarnLotId: yarnLot.id,
          receivedWeight: totalWeight,
          remainingWeight: totalWeight,
        },
        update: {
          receivedWeight: { increment: totalWeight },
          remainingWeight: { increment: totalWeight },
        },
      });

      await tx.auditLog.create({
        data: {
          tableName: 'yarn_inwards',
          recordId: String(inward.id),
          action: 'CREATE',
          oldData: undefined,
          newData: { yarnLotId: yarnLot.id, totalWeight },
          performedBy: 'system',
        },
      });

      await this.inventoryService.postInventoryMovement(
        {
          entityType: 'YarnPurchase',
          entityId: inward.id,
          itemType: 'YARN',
          inwardWeight: totalWeight,
          referenceNo: inward.hfBatch ?? undefined,
          remarks: 'Yarn Purchase',
        },
        tx,
      );

      return tx.yarnInward.findUnique({
        where: { id: inward.id },
        include: {
          mill: true,
          deliveryKnitter: true,
          yarnLots: true,
        },
      });
    });
  }

  findAll() {
    return this.prisma.yarnInward.findMany({
      include: {
        mill: true,
        deliveryKnitter: true,
        yarnLots: { select: { hfCode: true, id: true } },
        purchaseOrder: {
          select: {
            poNumber: true,
            date: true,
            hfCode: true,
            items: {
              select: {
                count: true,
                quality: true,
                rate: true,
                bags: true,
                bagWeight: true,
                totalWeight: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const inward = await this.prisma.yarnInward.findUnique({
      where: { id },
      include: { mill: true, deliveryKnitter: true, yarnLots: true },
    });
    if (!inward) throw new NotFoundException('Yarn inward not found');
    return inward;
  }

  async update(id: number, dto: UpdateYarnInwardDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.yarnInward.findUnique({
        where: { id },
        include: { yarnLots: true },
      });
      if (!existing) throw new NotFoundException('Yarn inward not found');

      // ── Issue 3: Received weight cannot exceed ordered weight ────────────
      if (dto.receivedWeight != null) {
        const orderedWeight = Number(existing.totalWeight);
        if (Number(dto.receivedWeight) > orderedWeight) {
          throw new BadRequestException(
            `Received weight (${dto.receivedWeight} kg) cannot exceed ` +
              `the ordered PO weight (${orderedWeight} kg)`,
          );
        }
      }

      // Check if transitioning from PENDING to RECEIVED
      const wasPending = existing.status === 'PENDING';
      const isNowReceived = dto.receivedWeight != null;

      const dataToUpdate: Prisma.YarnInwardUncheckedUpdateInput = {
        receiptDate: dto.receiptDate
          ? new Date(dto.receiptDate)
          : existing.receiptDate,
        millInvoiceNo: dto.millInvoiceNo ?? existing.millInvoiceNo,
        millDcNo: dto.millDcNo ?? existing.millDcNo,
      };

      if (isNowReceived && wasPending) {
        dataToUpdate.status = 'RECEIVED';
        dataToUpdate.receivedWeight = dto.receivedWeight;
      } else {
        // Fallback for regular updates
        dataToUpdate.millId = dto.millId ?? existing.millId;
        dataToUpdate.deliveryKnitterId =
          dto.deliveryKnitterId ?? existing.deliveryKnitterId;
        dataToUpdate.hfBatch = dto.hfBatch ?? existing.hfBatch;
        dataToUpdate.yarnCount = dto.yarnCount ?? existing.yarnCount;
        dataToUpdate.yarnQuality = dto.yarnQuality ?? existing.yarnQuality;
        dataToUpdate.rlVl = dto.rlVl ?? existing.rlVl;
        dataToUpdate.numBags = dto.numBags ?? existing.numBags;
        dataToUpdate.bagWeight = dto.bagWeight ?? existing.bagWeight;
        dataToUpdate.ratePerKg = dto.ratePerKg ?? existing.ratePerKg;
        dataToUpdate.cgstRate = dto.cgstRate ?? existing.cgstRate;
        dataToUpdate.sgstRate = dto.sgstRate ?? existing.sgstRate;
        dataToUpdate.purchaseAccount =
          dto.purchaseAccount ?? existing.purchaseAccount;
        dataToUpdate.remarks = dto.remarks ?? existing.remarks;
        dataToUpdate.purchaseOrderId =
          dto.purchaseOrderId !== undefined
            ? (dto.purchaseOrderId ?? null)
            : existing.purchaseOrderId;
        dataToUpdate.receivedWeight =
          dto.receivedWeight !== undefined
            ? (dto.receivedWeight ?? null)
            : existing.receivedWeight;
      }

      const updatedInward = await tx.yarnInward.update({
        where: { id },
        data: dataToUpdate,
        include: { mill: true, deliveryKnitter: true, yarnLots: true },
      });

      if (isNowReceived && wasPending) {
        // Create YarnLot (inventory entry) exactly once
        const yarnLot = await tx.yarnLot.create({
          data: {
            hfCode: existing.hfBatch ?? `YI-${existing.id}`,
            yarnInwardId: existing.id,
            millId: existing.millId,
            count: existing.yarnCount,
            quality: existing.yarnQuality,
            ratePerKg: Number(existing.ratePerKg ?? 0),
            totalWeight: Number(dto.receivedWeight),
            totalCost: Number(existing.totalCost ?? 0),
            availableWeight: Number(dto.receivedWeight),
            noOfBags: existing.numBags,
            bagWeight: Number(existing.bagWeight ?? 60),
            status: 'ACTIVE',
            deliveryTo: String(existing.deliveryKnitterId),
            description: existing.yarnQuality,
          },
        });

        // Post inventory movement for the knitter
        await this.inventoryService.postInventoryMovement(
          {
            entityType: 'KNITTER',
            entityId: existing.deliveryKnitterId,
            itemType: 'YARN',
            inwardWeight: Number(dto.receivedWeight),
            lotNo: existing.hfBatch ?? `YI-${existing.id}`,
            stage: 'YARN_INWARD',
            referenceNo: existing.purchaseOrderId ?? String(existing.id),
            remarks: 'Yarn Received from PO',
          },
          tx,
        );

        // Also update knitterStock directly
        await tx.knitterStock.upsert({
          where: {
            knitterId_yarnLotId: {
              knitterId: existing.deliveryKnitterId,
              yarnLotId: yarnLot.id,
            },
          },
          create: {
            knitterId: existing.deliveryKnitterId,
            yarnLotId: yarnLot.id,
            receivedWeight: Number(dto.receivedWeight),
            remainingWeight: Number(dto.receivedWeight),
          },
          update: {
            receivedWeight: { increment: Number(dto.receivedWeight) },
            remainingWeight: { increment: Number(dto.receivedWeight) },
          },
        });
      }

      return updatedInward;
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.yarnInward.delete({ where: { id } });
  }
}
