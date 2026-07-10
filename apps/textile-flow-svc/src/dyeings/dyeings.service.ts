import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDyeingDto, WorkflowStatus } from '@textile-flow/shared';
import { Prisma } from '@prisma/client';
import { WorkflowTransitionService } from '../workflow/workflow-transition.service';
import { InventoryService } from '../inventory/inventory.service';
import { LotTrackerService } from '../lot-tracker/lot-tracker.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class DyeingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowTransition: WorkflowTransitionService,
    private readonly inventoryService: InventoryService,
    private readonly lotTrackerService: LotTrackerService,
    private readonly activityLogger: ActivityLogsService,
  ) {}

  async findAll() {
    return this.prisma.dyeing.findMany({
      include: {
        dyer: true,
        colour: true,
        compacter: true,
        memoLine: {
          include: {
            memo: true,
            knittingLot: {
              include: {
                knitting: { include: { knitter: true } },
                entries: { include: { colour: true } },
              },
            },
            greyFabricLot: { include: { knitter: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const dyeing = await this.prisma.dyeing.findUnique({
      where: { id },
      include: { dyer: true, colour: true, compacter: true },
    });
    if (!dyeing) throw new NotFoundException('Dyeing record not found');
    return dyeing;
  }

  async update(id: number, dto: UpdateDyeingDto) {
    const existing = await this.findOne(id);

    // Use UncheckedUpdateInput so we can set scalar FKs (compacterId) directly
    const data: Prisma.DyeingUncheckedUpdateInput = {};

    if (dto.initialWeight !== undefined) data.initialWeight = dto.initialWeight;
    if (dto.finalWeight !== undefined) data.finalWeight = dto.finalWeight;
    if (dto.knitterDcNo !== undefined) data.knitterDcNo = dto.knitterDcNo;
    if (dto.compacterId !== undefined)
      data.compacterId = Number(dto.compacterId);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.dateGiven !== undefined) data.dateGiven = new Date(dto.dateGiven);
    if (dto.fbNo !== undefined) data.fbNo = dto.fbNo;

    // Task 4: new dyeing dispatch fields
    if (dto.receivedGreyWeight !== undefined)
      data.receivedGreyWeight = dto.receivedGreyWeight;
    if (dto.greyReceivedDate !== undefined)
      data.greyReceivedDate = new Date(dto.greyReceivedDate);
    if (dto.sentWeightToCompacter !== undefined)
      data.sentWeightToCompacter = dto.sentWeightToCompacter;

    // Auto-sync companyDcNo to lotNo (one-time fix for existing records, idempotent)
    if (!existing.companyDcNo) {
      data.companyDcNo = existing.lotNo;
    }

    // Process loss = absolute weight difference (greyWeight - dyedWeight) in kg
    if (dto.finalWeight !== undefined) {
      const greyWeight = dto.initialWeight ?? existing.initialWeight;

      if (dto.finalWeight > greyWeight) {
        throw new BadRequestException(
          `Final weight (${dto.finalWeight}) cannot exceed initial weight (${greyWeight})`,
        );
      }

      data.processLoss = Number((greyWeight - dto.finalWeight).toFixed(3));
    }

    const knitterDcNo =
      dto.knitterDcNo !== undefined ? dto.knitterDcNo : existing.knitterDcNo;
    const companyDcNo = existing.companyDcNo ?? existing.lotNo;

    // Explicit IN_DYEING transition when both DCs are present
    if (dto.status === undefined) {
      if (knitterDcNo && companyDcNo) {
        data.status = WorkflowStatus.IN_DYEING;
      } else if (knitterDcNo) {
        data.status = WorkflowStatus.SENT;
      } else {
        data.status = WorkflowStatus.PENDING;
      }
    }

    // Completion always overrides when finalWeight is being set
    if (dto.finalWeight !== undefined) {
      data.status = WorkflowStatus.COMPLETED;
    }

    const oldStatus = existing.status ?? WorkflowStatus.PENDING;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.dyeing.update({
        where: { id },
        data,
        include: { dyer: true, colour: true, compacter: true },
      });

      // Log explicit status transition
      const newStatus =
        typeof data.status === 'string' ? data.status : oldStatus;
      if (newStatus !== oldStatus) {
        await this.workflowTransition.transition(
          'Dyeing',
          id,
          oldStatus,
          newStatus,
        );
      }

      // Post DYED inward inventory when finalWeight is set for the first time
      if (dto.finalWeight !== undefined && existing.finalWeight === null) {
        await this.inventoryService.postInventoryMovement(
          {
            entityType: 'Dyeing',
            entityId: updated.id,
            itemType: 'DYED',
            inwardWeight: dto.finalWeight,
            lotNo: updated.lotNo,
            stage: 'DYED',
            remarks: 'Dyed fabric received',
          },
          tx,
        );

        if (
          updated.processLoss !== null &&
          updated.processLoss !== undefined &&
          updated.processLoss > 0
        ) {
          await this.inventoryService.postInventoryMovement(
            {
              entityType: 'Dyeing',
              entityId: updated.id,
              itemType: 'LOSS',
              outwardWeight: updated.processLoss,
              lotNo: updated.lotNo,
              remarks: 'Dyeing process loss',
            },
            tx,
          );
        }
      }

      // Task 4: post outward DYED inventory when sentWeightToCompacter is set for the first time
      if (
        dto.sentWeightToCompacter !== undefined &&
        existing.sentWeightToCompacter === null
      ) {
        await this.inventoryService.postInventoryMovement(
          {
            entityType: 'Dyeing',
            entityId: updated.id,
            itemType: 'DYED',
            outwardWeight: dto.sentWeightToCompacter,
            lotNo: updated.lotNo,
            stage: 'COMPACTING',
            remarks: 'Dyed fabric dispatched to compacter',
          },
          tx,
        );
      }

      await tx.auditLog.create({
        data: {
          tableName: 'dyeings',
          recordId: String(id),
          action: 'UPDATE',
          oldData: {
            status: existing.status,
            finalWeight: existing.finalWeight,
            processLoss: existing.processLoss,
            knitterDcNo: existing.knitterDcNo,
            companyDcNo: existing.companyDcNo,
          },
          newData: data as Prisma.InputJsonObject,
          performedBy: 'system',
        },
      });

      return updated;
    });

    // After transaction: update lot tracker if dyeing was completed
    if (dto.finalWeight !== undefined) {
      await this.lotTrackerService.evaluateLot(existing.lotNo).catch(() => {
        // Non-blocking
      });
    }

    // Activity log
    if (dto.finalWeight !== undefined) {
      void this.activityLogger.log({
        user: 'system',
        action: 'Dyeing Return Recorded',
        module: 'Dyeings',
        details: `Lot: ${result.lotNo} | Final: ${result.finalWeight?.toString() ?? '?'} kg | Loss: ${result.processLoss?.toString() ?? '0'} kg`,
      });
    } else {
      void this.activityLogger.log({
        user: 'system',
        action: 'Dyeing Updated',
        module: 'Dyeings',
        details: `Lot: ${result.lotNo} | Status: ${result.status}`,
      });
    }

    return result;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.dyeing.delete({ where: { id } });
  }
}
