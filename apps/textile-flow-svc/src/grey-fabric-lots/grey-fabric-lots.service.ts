import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GreyFabricLotsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(status?: string, source?: string) {
    return this.prisma.greyFabricLot.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(source ? { source: source as never } : {}),
      },
      include: {
        knitter: true,
        knitterProgram: { include: { yarnLot: true, yarnUsages: { include: { yarnLot: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
