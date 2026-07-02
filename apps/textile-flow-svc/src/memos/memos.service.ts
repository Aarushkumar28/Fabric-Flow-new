import { Injectable, BadRequestException } from '@nestjs/common';
import {
  PrismaService,
  type PrismaTransaction,
} from '../prisma/prisma.service';
import { CreateMemoDto, WorkflowStatus } from '@textile-flow/shared';
import { dyeingStatusFromDc } from '../common/adapters/workflow-status.adapter';
import { WorkflowTransitionService } from '../workflow/workflow-transition.service';
import { InventoryService } from '../inventory/inventory.service';
import { LotTrackerService } from '../lot-tracker/lot-tracker.service';
import { KnitterProgramsService } from '../knitter-programs/knitter-programs.service';

@Injectable()
export class MemosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowTransition: WorkflowTransitionService,
    private readonly inventoryService: InventoryService,
    private readonly lotTrackerService: LotTrackerService,
    private readonly knitterProgramsService: KnitterProgramsService,
  ) {}

  async create(dto: CreateMemoDto) {
    const collectedLotNos: string[] = [];
    const result = await this.prisma.$transaction(async (tx) => {
      const last = await tx.memo.findFirst({ orderBy: { memoNo: 'desc' } });
      const memoNo = dto.memoNo ?? (last?.memoNo ?? 39) + 1;

      // Task 1: dyerId is the single source of truth — no per-line fallback
      const dyerId =
        dto.dyerId ??
        (await tx.dyer.findFirst({ orderBy: { id: 'asc' } }))?.id;

      if (!dyerId) {
        throw new BadRequestException('Dyer is required to create a memo');
      }

      const memo = await tx.memo.create({
        data: {
          memoNo,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
          dyerId,
          remarks: dto.remarks,
        },
      });

      for (const line of dto.lines) {
        const resolved = await this.resolveMemoLine(tx, line);
        collectedLotNos.push(resolved.lotNo);
        const initialStatus = dyeingStatusFromDc(null, null);

        const memoLine = await tx.memoLine.create({
          data: {
            memoId: memo.id,
            knittingLotId: resolved.knittingLotId,
            greyFabricLotId: resolved.greyFabricLotId,
            sentWeight: line.sentWeight ?? resolved.sentWeight,
            yarnCount: line.yarnCount,
            dia: line.dia,
            gg: line.gg,
            loopLength: line.loopLength,
            fabricName: line.fabricName,
            fabricColour: line.fabricColour,
          },
        });

        const finalColourId = await this.resolveColourId(
          tx,
          line.fabricColour,
          resolved.colourId,
        );

        const dyeing = await tx.dyeing.create({
          data: {
            lotNo: resolved.lotNo,
            memoLineId: memoLine.id,
            hfCode: resolved.hfCode,
            // Task 1: single dyer from memo header — no per-line override
            dyerId,
            colourId: finalColourId,
            initialWeight: line.sentWeight ?? resolved.sentWeight,
            sourceType: resolved.sourceType,
            status: initialStatus,
            noOfRolls: resolved.noOfRolls,
            // companyDcNo auto-synced to lotNo for easy lookup
            companyDcNo: resolved.lotNo,
          },
        });

        // Log dyeing creation via workflow
        await this.workflowTransition.transition(
          'Dyeing',
          dyeing.id,
          '',
          initialStatus,
        );

        if (resolved.greyFabricLotId) {
          await tx.greyFabricLot.update({
            where: { id: resolved.greyFabricLotId },
            data: { status: WorkflowStatus.SENT },
          });
        }

        await this.inventoryService.postInventoryMovement(
          {
            entityType: 'GreyFabricLot',
            entityId: resolved.greyFabricLotId ?? 0,
            itemType: 'GREY',
            inwardWeight: line.sentWeight ?? resolved.sentWeight,
            lotNo: resolved.lotNo,
            stage: 'GREY',
            remarks: 'Grey fabric lot created',
          },
          tx,
        );

        await this.inventoryService.postInventoryMovement(
          {
            entityType: 'Memo',
            entityId: memo.id,
            itemType: 'GREY',
            outwardWeight: line.sentWeight ?? resolved.sentWeight,
            lotNo: resolved.lotNo,
            stage: 'DYEING',
            remarks: 'Grey fabric sent to dyeing',
          },
          tx,
        );
      }

      await tx.auditLog.create({
        data: {
          tableName: 'memos',
          recordId: String(memo.id),
          action: 'CREATE',
          oldData: undefined,
          newData: { memoNo, lines: dto.lines.length },
          performedBy: 'system',
        },
      });

      // Log memo creation via workflow
      await this.workflowTransition.transition(
        'Memo',
        memo.id,
        '',
        WorkflowStatus.PENDING,
      );

      return tx.memo.findUnique({
        where: { id: memo.id },
        include: {
          lines: {
            include: {
              knittingLot: {
                include: {
                  entries: { include: { colour: true } },
                  knitting: { include: { knitter: true } },
                },
              },
              greyFabricLot: { include: { knitter: true } },
              dyeing: true,
            },
          },
          dyer: true,
        },
      });
    });

    // After transaction: evaluate lot tracker for all dispatched lots
    for (const lotNo of collectedLotNos) {
      await this.lotTrackerService.evaluateLot(lotNo).catch(() => {
        // Non-blocking
      });
    }

    return result;
  }

  private async resolveMemoLine(
    tx: PrismaTransaction,
    line: CreateMemoDto['lines'][number],
  ) {
    // ─── Task 2b: explicit source enum routing ───────────────────────────────

    // Option: PROGRAM_LOT — resolve via knitterProgramId → its latest AVAILABLE lot
    if (line.knitterProgramId) {
      const lot = await tx.greyFabricLot.findFirst({
        where: {
          knitterProgramId: line.knitterProgramId,
          status: 'AVAILABLE',
        },
        include: {
          knitterProgram: {
            include: {
              yarnUsages: { include: { yarnLot: true } },
              yarnLot: true,
            },
          },
        },
        orderBy: { id: 'desc' },
      });
      if (!lot) {
        throw new BadRequestException(
          `No AVAILABLE grey fabric lot found for KnitterProgram #${line.knitterProgramId}`,
        );
      }

      const hfCode = lot.knitterProgram?.yarnUsages?.length
        ? lot.knitterProgram.yarnUsages.map((u) => u.yarnLot.hfCode).join(', ')
        : lot.knitterProgram?.yarnLot?.hfCode;

      return {
        knittingLotId: undefined,
        greyFabricLotId: lot.id,
        lotNo: lot.lotNumber,
        hfCode,
        colourId: await this.firstColourId(tx),
        sentWeight: Number(lot.greyWeight),
        noOfRolls: lot.rollCount ?? undefined,
        sourceType: 'KNITTED',
      };
    }

    // Option: NEW_PROGRAM — create program + lot inline inside the same transaction
    if (line.newProgram) {
      const { program, greyFabricLot } =
        await this.knitterProgramsService.createInTransaction(
          tx,
          line.newProgram,
        );

      return {
        knittingLotId: undefined,
        greyFabricLotId: greyFabricLot.id,
        lotNo: greyFabricLot.lotNumber,
        hfCode: undefined,
        colourId: await this.firstColourId(tx),
        sentWeight: line.sentWeight ?? Number(greyFabricLot.greyWeight),
        noOfRolls: program.numRolls ?? undefined,
        sourceType: 'KNITTED',
      };
    }

    // ─── Legacy paths (unchanged for backward compat) ────────────────────────

    if (line.knittingLotId) {
      const lot = await tx.knittingLot.findUnique({
        where: { id: line.knittingLotId },
        include: {
          entries: true,
          knitting: {
            include: {
              knitter: true,
              knittingYarnUsages: { include: { yarnLot: true } },
            },
          },
        },
      });
      if (!lot) {
        throw new BadRequestException(
          `Knitting lot ${line.knittingLotId} not found`,
        );
      }

      const weight =
        line.sentWeight ??
        lot.entries.reduce((sum, entry) => sum + entry.weight, 0) ??
        lot.knitting.greyFabricWeight;

      return {
        knittingLotId: lot.id,
        greyFabricLotId: undefined,
        lotNo: lot.lotNo,
        hfCode: lot.knitting.knittingYarnUsages[0]?.hfCode,
        colourId: lot.entries[0]?.colourId ?? (await this.firstColourId(tx)),
        sentWeight: weight,
        noOfRolls: lot.noOfRolls ?? lot.knitting.noOfRolls,
        sourceType: 'KNITTING',
      };
    }

    if (line.greyFabricLotId) {
      const lot = await tx.greyFabricLot.findUnique({
        where: { id: line.greyFabricLotId },
        include: {
          knitterProgram: {
            include: {
              yarnUsages: { include: { yarnLot: true } },
              yarnLot: true,
            },
          },
        },
      });
      if (!lot) {
        throw new BadRequestException(
          `Grey fabric lot ${line.greyFabricLotId} not found`,
        );
      }

      let hfCodes = lot.knitterProgram?.yarnLot?.hfCode;
      if (lot.knitterProgram?.yarnUsages?.length) {
        hfCodes = lot.knitterProgram.yarnUsages
          .map((u) => u.yarnLot.hfCode)
          .join(', ');
      }

      return {
        knittingLotId: undefined,
        greyFabricLotId: lot.id,
        lotNo: lot.lotNumber,
        hfCode: hfCodes,
        colourId: await this.firstColourId(tx),
        sentWeight: Number(lot.greyWeight),
        noOfRolls: lot.rollCount ?? undefined,
        sourceType: String(lot.source),
      };
    }

    if (line.yarnLotId && line.knitterId) {
      const yarnLot = await tx.yarnLot.findUnique({
        where: { id: line.yarnLotId },
      });
      if (!yarnLot) {
        throw new BadRequestException(`Yarn lot ${line.yarnLotId} not found`);
      }

      const sentWeight = line.sentWeight ?? yarnLot.availableWeight;

      if (sentWeight > yarnLot.availableWeight) {
        throw new BadRequestException(
          `Sent weight (${sentWeight}) exceeds available weight (${yarnLot.availableWeight}) for Yarn Lot ${yarnLot.id}`,
        );
      }

      // Decrement available weight
      await tx.yarnLot.update({
        where: { id: yarnLot.id },
        data: { availableWeight: { decrement: sentWeight } },
      });

      const greyFabricLot = await tx.greyFabricLot.create({
        data: {
          lotNumber: `GFL-${Date.now()}-${line.yarnLotId}`,
          knitterId: line.knitterId,
          greyWeight: sentWeight,
          rollCount: line.expectedRolls,
          source: 'KNITTED',
          status: 'AVAILABLE',
        },
      });

      return {
        knittingLotId: undefined,
        greyFabricLotId: greyFabricLot.id,
        lotNo: greyFabricLot.lotNumber,
        hfCode: yarnLot.hfCode,
        colourId: await this.firstColourId(tx),
        sentWeight,
        noOfRolls: line.expectedRolls,
        sourceType: 'KNITTING',
      };
    }

    throw new BadRequestException(
      'Memo line requires one of: knitterProgramId, newProgram, knittingLotId, greyFabricLotId, or yarnLotId+knitterId',
    );
  }

  private async firstColourId(tx: PrismaTransaction) {
    const colour = await tx.colour.findFirst({ orderBy: { id: 'asc' } });
    if (!colour)
      throw new BadRequestException('At least one colour is required');
    return colour.id;
  }

  private async resolveColourId(
    tx: PrismaTransaction,
    fabricColour?: string,
    fallbackId?: number,
  ) {
    if (!fabricColour) {
      return fallbackId ?? (await this.firstColourId(tx));
    }
    const parsedId = parseInt(fabricColour, 10);
    if (!isNaN(parsedId)) {
      const col = await tx.colour.findUnique({ where: { id: parsedId } });
      if (col) return col.id;
    }
    const col = await tx.colour.findFirst({
      where: {
        OR: [
          { name: { equals: fabricColour, mode: 'insensitive' } },
          { code: { equals: fabricColour, mode: 'insensitive' } },
        ],
      },
    });
    if (col) return col.id;
    return fallbackId ?? (await this.firstColourId(tx));
  }

  async findAll() {
    return this.prisma.memo.findMany({
      include: {
        lines: {
          include: {
            knittingLot: {
              include: {
                entries: { include: { colour: true } },
                knitting: { include: { knitter: true } },
              },
            },
            greyFabricLot: { include: { knitter: true } },
            dyeing: true,
          },
        },
        dyer: true,
      },
      orderBy: { memoNo: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.memo.findUniqueOrThrow({
      where: { id },
      include: {
        lines: {
          include: {
            knittingLot: true,
            greyFabricLot: true,
            dyeing: true,
          },
        },
        dyer: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.dyeing.deleteMany({ where: { memoLine: { memoId: id } } });
      await tx.memoLine.deleteMany({ where: { memoId: id } });
      return tx.memo.delete({ where: { id } });
    });
  }
}
