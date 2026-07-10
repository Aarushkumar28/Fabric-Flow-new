import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInhouseKnittedFabricDto } from '@textile-flow/shared';

@Injectable()
export class InhouseKnittedFabricsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInhouseKnittedFabricDto) {
    return this.prisma.inhouseKnittedFabric.create({
      data: {
        lotNo: dto.lotNo,
        description: dto.description,
        weight: dto.weight,
      },
    });
  }

  async findAll() {
    return this.prisma.inhouseKnittedFabric.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.inhouseKnittedFabric.findUnique({
      where: { id },
    });
    if (!record)
      throw new NotFoundException('Inhouse knitted fabric not found');
    return record;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.inhouseKnittedFabric.delete({ where: { id } });
  }
}
