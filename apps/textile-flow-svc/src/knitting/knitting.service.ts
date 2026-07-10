import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowStatus } from '@textile-flow/shared';
import { WorkflowTransitionService } from '../workflow/workflow-transition.service';
import { InventoryService } from '../inventory/inventory.service';
import { LotTrackerService } from '../lot-tracker/lot-tracker.service';

@Injectable()
export class KnittingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowTransition: WorkflowTransitionService,
    private readonly inventoryService: InventoryService,
    private readonly lotTrackerService: LotTrackerService,
  ) {}

  /**
   * Records the received grey fabric weight for a knitting batch.
   * Shortage = greyFabricWeight (expected) - receivedWeight (actual).
   * Transitions status to RECEIVED and logs the workflow event.
   */
  async receiveYarn(knittingId: number, receivedWeight: number) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const knitting = await tx.knitting.findUnique({
        where: { id: knittingId },
      });

      if (!knitting) {
        throw new NotFoundException('Knitting entry not found');
      }

      // greyFabricWeight is the expected issued output weight
      const shortage = Number(
        (knitting.greyFabricWeight - receivedWeight).toFixed(3),
      );

      const result = await tx.knitting.update({
        where: { id: knittingId },
        data: {
          receivedWeight,
          shortage,
          status: WorkflowStatus.RECEIVED,
        },
      });

      await this.workflowTransition.transition(
        'Knitting',
        knitting.id,
        knitting.status ?? WorkflowStatus.PENDING,
        WorkflowStatus.RECEIVED,
      );

      await this.inventoryService.postInventoryMovement(
        {
          entityType: 'Knitting',
          entityId: result.id,
          itemType: 'GREY',
          inwardWeight: receivedWeight,
          referenceNo: result.dcNo ?? undefined,
          lotNo: `KL-${result.id}`,
          stage: 'GREY',
          remarks: 'Grey fabric received',
        },
        tx,
      );

      return result;
    });

    // After transaction: find KnittingLot to get lotNo for lot tracking
    const kLot = await this.prisma.knittingLot.findFirst({
      where: { knittingId: updated.id },
      orderBy: { createdAt: 'asc' },
    });
    if (kLot?.lotNo) {
      await this.lotTrackerService.evaluateLot(kLot.lotNo).catch(() => {
        // Non-blocking: lot tracker failure should not break the main flow
      });
    }

    return updated;
  }

  async findAll() {
    return this.prisma.knitting.findMany({
      include: {
        knitter: true,
        knittingYarnUsages: { include: { yarnLot: true } },
        knittingLots: { include: { entries: { include: { colour: true } } } },
      },
      orderBy: { dateGiven: 'desc' },
    });
  }

  async findOne(id: number) {
    const knitting = await this.prisma.knitting.findUnique({
      where: { id },
      include: {
        knitter: true,
        knittingYarnUsages: { include: { yarnLot: true } },
        knittingLots: { include: { entries: { include: { colour: true } } } },
      },
    });
    if (!knitting) throw new NotFoundException('Knitting not found');
    return knitting;
  }
}
