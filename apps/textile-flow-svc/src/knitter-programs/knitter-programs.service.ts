import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

type YarnUsageInput = { yarnLotId: number; quantityUsed: number };

export type CreateKnitterProgramBody = {
  knitterId: number;
  yarns: YarnUsageInput[];
  greyWeight: number;
  numRolls?: number;
  dia?: string;
  gg?: string;
  loopLength?: string;
  fabricName?: string;
  fabricColour?: string;
  programmeRef?: string;
  preAssignedDyerId?: number;
  programDate?: string;
  blendType?: string;
  blendPercent?: number;
};

@Injectable()
export class KnitterProgramsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogger: ActivityLogsService,
  ) {}

  /** Public helper used by MemosService to create a program inside an existing tx */
  async createInTransaction(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    dto: CreateKnitterProgramBody,
  ) {
    let totalQuantityUsed = 0;

    // 1. Verify stock for all specified yarns
    for (const yarn of dto.yarns) {
      const stock = await tx.knitterStock.findUnique({
        where: {
          knitterId_yarnLotId: {
            knitterId: dto.knitterId,
            yarnLotId: yarn.yarnLotId,
          },
        },
      });

      if (!stock || stock.remainingWeight < yarn.quantityUsed) {
        throw new BadRequestException(
          `Insufficient yarn stock for lot ID ${yarn.yarnLotId}`,
        );
      }

      totalQuantityUsed += Number(yarn.quantityUsed);
    }

    // 2. Decrement stock for all specified yarns
    for (const yarn of dto.yarns) {
      await tx.knitterStock.update({
        where: {
          knitterId_yarnLotId: {
            knitterId: dto.knitterId,
            yarnLotId: yarn.yarnLotId,
          },
        },
        data: { remainingWeight: { decrement: yarn.quantityUsed } },
      });
    }

    // 3. Auto-generate programNo inside transaction to avoid races
    const last = await tx.knitterProgram.findFirst({
      orderBy: { id: 'desc' },
    });
    const nextNum = last?.id ? last.id + 1 : 1;
    // We use a temp placeholder and update after create (Prisma autoincrement id not available pre-create)
    // Instead: count all programs to derive next sequential display number
    const count = await tx.knitterProgram.count();
    const programNo = `KP-${String(count + 1).padStart(4, '0')}`;

    // 4. Create KnitterProgram with nested yarnUsages
    const program = await tx.knitterProgram.create({
      data: {
        programNo,
        knitterId: dto.knitterId,
        greyWeight: dto.greyWeight,
        dia: dto.dia,
        gg: dto.gg,
        loopLength: dto.loopLength,
        blendType: dto.blendType,
        blendPercent: dto.blendPercent,
        anomalyFlag: dto.greyWeight > totalQuantityUsed,
        programDate: dto.programDate ? new Date(dto.programDate) : new Date(),
        yarnUsages: {
          create: dto.yarns.map((yarn) => ({
            yarnLotId: yarn.yarnLotId,
            quantityUsed: yarn.quantityUsed,
          })),
        },
      },
    });

    // 5. Create initial GreyFabricLot (AVAILABLE immediately — fabric already knitted)
    const greyFabricLot = await tx.greyFabricLot.create({
      data: {
        lotNumber: `GFL-${program.id}`,
        knitterProgramId: program.id,
        knitterId: dto.knitterId,
        greyWeight: dto.greyWeight,
        source: 'KNITTED',
        status: 'AVAILABLE',
      },
    });

    // 6. Audit Log
    await tx.auditLog.create({
      data: {
        tableName: 'knitter_programs',
        recordId: String(program.id),
        action: 'CREATE',
        newData: {
          programNo,
          yarns: dto.yarns,
          greyWeight: dto.greyWeight,
        },
        performedBy: 'system',
      },
    });

    return { program, greyFabricLot };
  }

  create(dto: CreateKnitterProgramBody) {
    return this.prisma.$transaction(async (tx) => {
      const { program } = await this.createInTransaction(tx, dto);

      return tx.knitterProgram.findUnique({
        where: { id: program.id },
        include: {
          knitter: true,
          yarnLot: true,
          preAssignedDyer: true,
          greyFabricLots: true,
        },
      });
    }).then((result) => {
      void this.activityLogger.log({
        user: 'system',
        action: 'Knitter Program Created',
        module: 'Knitter Programs',
        details: `Program #${result?.programNo ?? '?'} | Knitter ID: ${dto.knitterId} | Grey: ${dto.greyWeight} kg`,
      });
      return result;
    });
  }

  findAll() {
    return this.prisma.knitterProgram.findMany({
      include: {
        knitter: true,
        yarnLot: true,
        preAssignedDyer: true,
        greyFabricLots: true,
      },
      orderBy: { programDate: 'desc' },
    });
  }

  async remove(id: number) {
    const program = await this.prisma.knitterProgram.findUnique({
      where: { id },
    });

    if (!program) {
      throw new BadRequestException('Knitter program not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Revert stock — only applies to legacy single-yarn programs
      if (program.yarnLotId != null && program.quantityUsed != null) {
        await tx.knitterStock.updateMany({
          where: {
            knitterId: program.knitterId,
            yarnLotId: program.yarnLotId,
          },
          data: {
            remainingWeight: { increment: program.quantityUsed.toNumber() },
          },
        });
      }

      // Delete greyFabricLots associated with it
      await tx.greyFabricLot.deleteMany({
        where: { knitterProgramId: program.id },
      });

      // Delete the program itself
      const deleted = await tx.knitterProgram.delete({ where: { id } });
      return deleted;
    }).then((deleted) => {
      void this.activityLogger.log({
        user: 'system',
        action: 'Knitter Program Deleted',
        module: 'Knitter Programs',
        details: `Program #${deleted.programNo ?? id} | Knitter ID: ${program.knitterId}`,
      });
      return deleted;
    });
  }
}
