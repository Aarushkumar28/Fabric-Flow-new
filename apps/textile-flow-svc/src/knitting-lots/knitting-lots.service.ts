import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KnittingLotsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.knittingLot.findMany({
      include: {
        entries: { include: { colour: true } },
        dyer: true,
        knitting: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const lot = await this.prisma.knittingLot.findUnique({
      where: { id },
      include: {
        entries: { include: { colour: true } },
        dyer: true,
        knitting: true,
      },
    });
    if (!lot) throw new NotFoundException('Knitting lot not found');
    return lot;
  }
}
