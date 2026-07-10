import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMillDto, UpdateMillDto } from '@textile-flow/shared';

@Injectable()
export class MillsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMillDto) {
    const data = {
      ...dto,
      // Convert empty GSTIN to null to avoid unique constraint violations
      gstin: dto.gstin?.trim() || null,
    };
    return this.prisma.mill.create({ data });
  }

  async findAll() {
    return this.prisma.mill.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const mill = await this.prisma.mill.findUnique({ where: { id } });
    if (!mill) throw new NotFoundException(`Mill with id ${id} not found`);
    return mill;
  }

  async update(id: number, dto: UpdateMillDto) {
    await this.findOne(id);
    return this.prisma.mill.update({
      where: { id },
      data: {
        ...dto,
        gstin:
          dto.gstin !== undefined ? dto.gstin?.trim() || null : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // Hard delete with cascade: remove all dependent records first
    return this.prisma.$transaction(async (tx) => {
      // Find all yarn lots belonging to this mill
      const yarnLots = await tx.yarnLot.findMany({
        where: { millId: id },
        select: { id: true },
      });
      const lotIds = yarnLots.map((l) => l.id);

      if (lotIds.length > 0) {
        // Delete knitter program yarn usages referencing these lots
        await tx.knitterProgramYarnUsage.deleteMany({
          where: { yarnLotId: { in: lotIds } },
        });
        // Delete knitter programs referencing these lots
        await tx.knitterProgram.deleteMany({
          where: { yarnLotId: { in: lotIds } },
        });
        // Delete delivery notes referencing these lots
        await tx.deliveryNote.deleteMany({
          where: { yarnLotId: { in: lotIds } },
        });
        // Delete knitter stocks
        await tx.knitterStock.deleteMany({
          where: { yarnLotId: { in: lotIds } },
        });
        // Delete yarn receipts
        await tx.yarnReceipt.deleteMany({
          where: { yarnLotId: { in: lotIds } },
        });
        // Delete knitting yarn usages
        await tx.knittingYarnUsage.deleteMany({
          where: { yarnLotId: { in: lotIds } },
        });
        // Delete the yarn lots themselves
        await tx.yarnLot.deleteMany({ where: { id: { in: lotIds } } });
      }

      // Delete yarn inwards referencing this mill
      await tx.yarnInward.deleteMany({ where: { millId: id } });

      // Finally delete the mill
      return tx.mill.delete({ where: { id } });
    });
  }
}
