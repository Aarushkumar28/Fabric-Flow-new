import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGreyFabricInwardDto } from '@textile-flow/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GreyFabricInwardService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateGreyFabricInwardDto) {
    const totalCost =
      dto.totalWeight && dto.ratePerKg
        ? dto.totalWeight * dto.ratePerKg
        : undefined;

    return this.prisma.greyFabricInward.create({
      data: {
        receiptDate: dto.receiptDate ? new Date(dto.receiptDate) : new Date(),
        supplierName: dto.supplierName,
        fabricType: dto.fabricType,
        colour: dto.colour,
        totalWeight: dto.totalWeight,
        rollCount: dto.rollCount,
        ratePerKg: dto.ratePerKg,
        totalCost,
        purchaseAccount: dto.purchaseAccount,
        remarks: dto.remarks,
      },
    });
  }

  findAll() {
    return this.prisma.greyFabricInward.findMany({
      orderBy: { receiptDate: 'desc' },
      include: { greyFabricLots: true },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.greyFabricInward.findUnique({
      where: { id },
      include: { greyFabricLots: true },
    });
    if (!record)
      throw new NotFoundException('Grey fabric inward record not found');
    return record;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.greyFabricInward.delete({ where: { id } });
  }
}
