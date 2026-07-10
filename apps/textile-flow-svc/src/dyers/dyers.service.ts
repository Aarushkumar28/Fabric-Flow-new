import { Injectable } from '@nestjs/common';
import { CreateDyerDto, UpdateDyerDto } from '@textile-flow/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DyersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.dyer.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: CreateDyerDto) {
    return this.prisma.dyer.create({
      data: { ...dto, gstin: dto.gstin?.trim() || null },
    });
  }

  findOne(id: number) {
    return this.prisma.dyer.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, dto: UpdateDyerDto) {
    return this.prisma.dyer.update({
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
      // Delete dyeings (which reference this dyer)
      const dyeings = await tx.dyeing.findMany({
        where: { dyerId: id },
        select: { id: true },
      });
      const dyeingIds = dyeings.map((d) => d.id);
      if (dyeingIds.length > 0) {
        // Delete compactings that reference these dyeings
        await tx.compacting.deleteMany({
          where: { dyeingId: { in: dyeingIds } },
        });
        await tx.dyeing.deleteMany({ where: { id: { in: dyeingIds } } });
      }

      // Delete dyeing programs
      await tx.dyeingProgram.deleteMany({ where: { dyerId: id } });

      // Nullify pre-assigned dyer in knitter programs
      await tx.knitterProgram.updateMany({
        where: { preAssignedDyerId: id },
        data: { preAssignedDyerId: null },
      });

      // Delete memos
      const memos = await tx.memo.findMany({
        where: { dyerId: id },
        select: { id: true },
      });
      if (memos.length > 0) {
        await tx.memo.deleteMany({ where: { dyerId: id } });
      }

      // Delete knitting lots referencing this dyer
      const knittingLots = await tx.knittingLot.findMany({
        where: { dyerId: id },
        select: { id: true },
      });
      if (knittingLots.length > 0) {
        const lotIds = knittingLots.map((l) => l.id);
        await tx.knittingLotEntry.deleteMany({
          where: { knittingLotId: { in: lotIds } },
        });
        await tx.knittingLot.deleteMany({ where: { id: { in: lotIds } } });
      }

      // Finally delete the dyer
      return tx.dyer.delete({ where: { id } });
    });
  }
}
