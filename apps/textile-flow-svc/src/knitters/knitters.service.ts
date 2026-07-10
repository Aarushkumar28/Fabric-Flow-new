import { Injectable } from '@nestjs/common';
import { CreateKnitterDto, UpdateKnitterDto } from '@textile-flow/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KnittersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.knitter.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: CreateKnitterDto) {
    return this.prisma.knitter.create({
      data: { ...dto, gstin: dto.gstin?.trim() || null },
    });
  }

  findOne(id: number) {
    return this.prisma.knitter.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, dto: UpdateKnitterDto) {
    return this.prisma.knitter.update({
      where: { id },
      data: {
        ...dto,
        gstin:
          dto.gstin !== undefined ? dto.gstin?.trim() || null : undefined,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.$transaction(async (tx) => {
      // Delete knitter stocks
      await tx.knitterStock.deleteMany({ where: { knitterId: id } });

      // Delete delivery notes (both source and destination)
      await tx.deliveryNote.deleteMany({
        where: {
          OR: [{ sourceKnitterId: id }, { destinationKnitterId: id }],
        },
      });

      // Delete knitter program yarn usages for programs owned by this knitter
      const programs = await tx.knitterProgram.findMany({
        where: { knitterId: id },
        select: { id: true },
      });
      const programIds = programs.map((p) => p.id);
      if (programIds.length > 0) {
        await tx.knitterProgramYarnUsage.deleteMany({
          where: { knitterProgramId: { in: programIds } },
        });
      }

      // Delete knitter programs
      await tx.knitterProgram.deleteMany({ where: { knitterId: id } });

      // Delete yarn inwards delivered to this knitter
      await tx.yarnInward.deleteMany({ where: { deliveryKnitterId: id } });

      // Delete grey fabric lots
      await tx.greyFabricLot.deleteMany({ where: { knitterId: id } });

      // Delete knittings
      const knittings = await tx.knitting.findMany({
        where: { knitterNameId: id },
        select: { id: true },
      });
      const knittingIds = knittings.map((k) => k.id);
      if (knittingIds.length > 0) {
        // Delete knitting lots and their entries
        const lots = await tx.knittingLot.findMany({
          where: { knittingId: { in: knittingIds } },
          select: { id: true },
        });
        const lotIds = lots.map((l) => l.id);
        if (lotIds.length > 0) {
          await tx.knittingLotEntry.deleteMany({
            where: { knittingLotId: { in: lotIds } },
          });
          await tx.knittingLot.deleteMany({
            where: { id: { in: lotIds } },
          });
        }
        await tx.knittingYarnUsage.deleteMany({
          where: { knittingId: { in: knittingIds } },
        });
        await tx.knitting.deleteMany({
          where: { id: { in: knittingIds } },
        });
      }

      // Finally delete the knitter
      return tx.knitter.delete({ where: { id } });
    });
  }
}
