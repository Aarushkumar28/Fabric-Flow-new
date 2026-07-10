import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMillDto, UpdateMillDto } from '@textile-flow/shared';

@Injectable()
export class MillsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMillDto) {
    return this.prisma.mill.create({ data: dto });
  }

  async findAll() {
    return this.prisma.mill.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const mill = await this.prisma.mill.findUnique({ where: { id } });
    if (!mill) throw new NotFoundException(`Mill with id ${id} not found`);
    return mill;
  }

  async update(id: number, dto: UpdateMillDto) {
    await this.findOne(id);
    return this.prisma.mill.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.mill.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
