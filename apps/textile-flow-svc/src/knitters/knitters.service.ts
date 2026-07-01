import { Injectable } from '@nestjs/common';
import { CreateKnitterDto, UpdateKnitterDto } from '@textile-flow/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KnittersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.knitter.findMany();
  }

  create(dto: CreateKnitterDto) {
    return this.prisma.knitter.create({ data: dto });
  }

  findOne(id: number) {
    return this.prisma.knitter.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, dto: UpdateKnitterDto) {
    return this.prisma.knitter.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.knitter.delete({ where: { id } });
  }
}
