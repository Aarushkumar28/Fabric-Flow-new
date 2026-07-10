import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDyeingOrderDto } from '@textile-flow/shared';

@Injectable()
export class DyeingOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDyeingOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.dyeingOrder.create({
        data: {
          orderNo: dto.orderNo || `DO-${Date.now()}`,
          lines: {
            create: dto.lines.map((line) => ({
              knittingId: line.knittingId,
              quantity: line.quantity,
            })),
          },
        },
      });

      return tx.dyeingOrder.findUnique({
        where: { id: order.id },
        include: { lines: { include: { knitting: true } } },
      });
    });
  }

  async findAll() {
    return this.prisma.dyeingOrder.findMany({
      include: { lines: { include: { knitting: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
