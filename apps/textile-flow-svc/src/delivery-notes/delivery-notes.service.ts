import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryNoteDto } from '@textile-flow/shared';

@Injectable()
export class DeliveryNotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDeliveryNoteDto) {
    return this.prisma.$transaction(async (tx) => {
      // Fetch source stock
      const srcStock = await tx.knitterStock.findUnique({
        where: {
          knitterId_yarnLotId: {
            knitterId: dto.sourceKnitterId,
            yarnLotId: dto.yarnLotId,
          },
        },
      });

      if (!srcStock || srcStock.remainingWeight < dto.quantity) {
        throw new BadRequestException('Insufficient stock at source knitter');
      }

      // Deduct source
      await tx.knitterStock.update({
        where: {
          knitterId_yarnLotId: {
            knitterId: dto.sourceKnitterId,
            yarnLotId: dto.yarnLotId,
          },
        },
        data: { remainingWeight: { decrement: dto.quantity } },
      });

      // Add to destination (upsert)
      await tx.knitterStock.upsert({
        where: {
          knitterId_yarnLotId: {
            knitterId: dto.destinationKnitterId,
            yarnLotId: dto.yarnLotId,
          },
        },
        create: {
          knitterId: dto.destinationKnitterId,
          yarnLotId: dto.yarnLotId,
          receivedWeight: dto.quantity,
          remainingWeight: dto.quantity,
        },
        update: {
          receivedWeight: { increment: dto.quantity },
          remainingWeight: { increment: dto.quantity },
        },
      });

      // Create delivery note
      return tx.deliveryNote.create({
        data: {
          sourceKnitterId: dto.sourceKnitterId,
          destinationKnitterId: dto.destinationKnitterId,
          yarnLotId: dto.yarnLotId,
          quantity: dto.quantity,
          dcNumber: dto.dcNumber,
          note: dto.note,
        },
        include: {
          sourceKnitter: true,
          destinationKnitter: true,
          yarnLot: true,
        },
      });
    });
  }

  async findAll() {
    return this.prisma.deliveryNote.findMany({
      include: { sourceKnitter: true, destinationKnitter: true, yarnLot: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
