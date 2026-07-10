import { Injectable } from '@nestjs/common';
import { CreateColourDto, UpdateColourDto } from '@textile-flow/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ColoursService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.colour.findMany();
  }

  create(dto: CreateColourDto) {
    return this.prisma.colour.create({ data: dto });
  }

  findOne(id: number) {
    return this.prisma.colour.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, dto: UpdateColourDto) {
    return this.prisma.colour.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.colour.delete({ where: { id } });
  }
}
