import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CreateKnitterProgramBody = {
  knitterId: number;
  yarns: { yarnLotId: number; quantityUsed: number }[];
  greyWeight: number;
  dia?: string;
  gg?: string;
  loopLength?: string;
  programDate?: string;
  blendType?: string;
  blendPercent?: number;
};

@Injectable()
export class KnitterProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateKnitterProgramBody) {
    return this.prisma.$transaction(async (tx) => {
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
          throw new BadRequestException(`Insufficient yarn stock for lot ID ${yarn.yarnLotId}`);
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

      // 3. Create KnitterProgram with nested yarnUsages
      const program = await tx.knitterProgram.create({
        data: {
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

      // 4. Create initial GreyFabricLot
      await tx.greyFabricLot.create({
        data: {
          lotNumber: `GFL-${program.id}`,
          knitterProgramId: program.id,
          knitterId: dto.knitterId,
          greyWeight: dto.greyWeight,
          source: 'KNITTED',
          status: 'AVAILABLE',
        },
      });

      // 5. Audit Log (simplified)
      await tx.auditLog.create({
        data: {
          tableName: 'knitter_programs',
          recordId: String(program.id),
          action: 'CREATE',
          newData: {
            yarns: dto.yarns,
            greyWeight: dto.greyWeight,
          },
          performedBy: 'system',
        },
      });

      return tx.knitterProgram.findUnique({
        where: { id: program.id },
        include: {
          knitter: true,
          greyFabricLots: true,
          yarnUsages: {
            include: { yarnLot: true },
          },
        },
      });
    });
  }

  findAll() {
    return this.prisma.knitterProgram.findMany({
      include: {
        knitter: true,
        yarnUsages: {
          include: { yarnLot: true },
        },
        greyFabricLots: true,
      },
      orderBy: { programDate: 'desc' },
    });
  }

  async remove(id: number) {
    const program = await this.prisma.knitterProgram.findUnique({
      where: { id },
      include: { yarnUsages: true },
    });

    if (!program) {
      throw new BadRequestException('Knitter program not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Revert stock for all yarn usages
      for (const usage of program.yarnUsages) {
        await tx.knitterStock.updateMany({
          where: {
            knitterId: program.knitterId,
            yarnLotId: usage.yarnLotId,
          },
          data: {
            remainingWeight: { increment: usage.quantityUsed.toNumber() },
          },
        });
      }

      // Delete greyFabricLots associated with it
      await tx.greyFabricLot.deleteMany({
        where: { knitterProgramId: program.id },
      });

      // Delete the program itself (Cascade will delete yarnUsages)
      return tx.knitterProgram.delete({ where: { id } });
    });
  }
}
