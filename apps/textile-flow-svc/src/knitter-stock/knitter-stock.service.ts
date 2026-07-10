import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KnitterStockService {
  constructor(private readonly prisma: PrismaService) {}

  async findByKnitter(knitterId: number) {
    const knitter = await this.prisma.knitter.findUnique({
      where: { id: knitterId },
    });
    if (!knitter) throw new NotFoundException('Knitter not found');

    return this.prisma.knitterStock.findMany({
      where: { knitterId },
      include: {
        yarnLot: { select: { id: true, hfCode: true } },
      },
    });
  }
}
