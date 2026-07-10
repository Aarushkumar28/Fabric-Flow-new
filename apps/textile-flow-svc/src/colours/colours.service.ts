import { Injectable } from '@nestjs/common';
import { CreateColourDto, UpdateColourDto } from '@textile-flow/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ColoursService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.colour.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: CreateColourDto) {
    return this.prisma.colour.create({ data: dto });
  }

  findOne(id: number) {
    return this.prisma.colour.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, dto: UpdateColourDto) {
    return this.prisma.colour.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    return this.prisma.$transaction(async (tx) => {
      // Nullify colour references in yarn lots (colourId is optional)
      await tx.yarnLot.updateMany({
        where: { colourId: id },
        data: { colourId: null },
      });

      // Delete dyeings referencing this colour (colourId is required)
      // First delete compactings that reference these dyeings
      const dyeings = await tx.dyeing.findMany({
        where: { colourId: id },
        select: { id: true },
      });
      const dyeingIds = dyeings.map((d) => d.id);
      if (dyeingIds.length > 0) {
        await tx.compacting.deleteMany({
          where: { dyeingId: { in: dyeingIds } },
        });
        await tx.dyeing.deleteMany({ where: { id: { in: dyeingIds } } });
      }

      // Delete dyeing programs referencing this colour (colourId is required)
      await tx.dyeingProgram.deleteMany({ where: { colourId: id } });

      // Delete knitting lot entries referencing this colour (colourId is required)
      await tx.knittingLotEntry.deleteMany({ where: { colourId: id } });

      // Nullify colour references in compactings (colourId is optional)
      await tx.compacting.updateMany({
        where: { colourId: id },
        data: { colourId: null },
      });

      // Finally delete the colour
      return tx.colour.delete({ where: { id } });
    });
  }
}
