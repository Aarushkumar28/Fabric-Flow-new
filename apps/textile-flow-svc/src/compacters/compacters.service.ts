import { Injectable } from '@nestjs/common';
import { CreateCompacterDto, UpdateCompacterDto } from '@textile-flow/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompactersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.compacter.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: CreateCompacterDto) {
    return this.prisma.compacter.create({
      data: { ...dto, gstin: dto.gstin?.trim() || null },
    });
  }

  findOne(id: number) {
    return this.prisma.compacter.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, dto: UpdateCompacterDto) {
    return this.prisma.compacter.update({
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
      // Delete compactings referencing this compacter
      await tx.compacting.deleteMany({ where: { compacterId: id } });

      // Delete dyeings assigned to this compacter
      await tx.dyeing.updateMany({
        where: { compacterId: id },
        data: { compacterId: null },
      });

      // Finally delete the compacter
      return tx.compacter.delete({ where: { id } });
    });
  }
}
