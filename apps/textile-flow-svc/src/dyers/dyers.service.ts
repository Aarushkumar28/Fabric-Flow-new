import { Injectable } from '@nestjs/common';
import { CreateDyerDto, UpdateDyerDto } from '@textile-flow/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DyersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.dyer.findMany();
  }

  create(dto: CreateDyerDto) {
    return this.prisma.dyer.create({ data: dto });
  }

  findOne(id: number) {
    return this.prisma.dyer.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, dto: UpdateDyerDto) {
    return this.prisma.dyer.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.dyer.delete({ where: { id } });
  }
}
