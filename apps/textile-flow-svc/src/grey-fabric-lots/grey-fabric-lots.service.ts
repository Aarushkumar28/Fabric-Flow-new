import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GreyFabricLotsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(status?: string) {
    return this.prisma.greyFabricLot.findMany({
      where: status ? { status: status as never } : undefined,
      include: {
        knitter: true,
        knitterProgram: { include: { yarnLot: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
