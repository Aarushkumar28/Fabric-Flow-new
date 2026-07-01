import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDyeingProgramDto } from '@textile-flow/shared';

@Injectable()
export class DyeingProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDyeingProgramDto) {
    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.greyFabricLot.findUnique({
        where: { id: dto.greyFabricLotId },
      });
      if (!lot) throw new NotFoundException('Grey fabric lot not found');
      if (lot.status === 'CONSUMED') {
        throw new BadRequestException('Grey fabric lot already consumed');
      }
      if (lot.status === 'DELETED') {
        throw new BadRequestException('Grey fabric lot is deleted');
      }

      const program = await tx.dyeingProgram.create({
        data: {
          programNo: dto.programNo,
          dyerId: dto.dyerId,
          colourId: dto.colourId,
          greyFabricLotId: dto.greyFabricLotId,
          startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
          remarks: dto.remarks,
        },
      });

      await tx.greyFabricLot.update({
        where: { id: dto.greyFabricLotId },
        data: { status: 'CONSUMED' },
      });

      return tx.dyeingProgram.findUnique({
        where: { id: program.id },
        include: {
          dyer: true,
          colour: true,
          greyFabricLot: true,
        },
      });
    });
  }

  findAll() {
    return this.prisma.dyeingProgram.findMany({
      include: {
        dyer: true,
        colour: true,
        greyFabricLot: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const program = await this.prisma.dyeingProgram.findUnique({
      where: { id },
      include: {
        dyer: true,
        colour: true,
        greyFabricLot: true,
      },
    });

    if (!program) throw new NotFoundException('Dyeing program not found');
    return program;
  }

  async remove(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const program = await tx.dyeingProgram.findUnique({ where: { id } });
      if (!program) throw new NotFoundException('Dyeing program not found');

      await tx.dyeingProgram.delete({ where: { id } });
      await tx.greyFabricLot.update({
        where: { id: program.greyFabricLotId },
        data: { status: 'AVAILABLE' },
      });

      return { success: true };
    });
  }
}
