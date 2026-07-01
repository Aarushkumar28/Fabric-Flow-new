import { Injectable } from '@nestjs/common';
import { CreateCompacterDto, UpdateCompacterDto } from '@textile-flow/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompactersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.compacter.findMany();
  }

  create(dto: CreateCompacterDto) {
    return this.prisma.compacter.create({ data: dto });
  }

  findOne(id: number) {
    return this.prisma.compacter.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, dto: UpdateCompacterDto) {
    return this.prisma.compacter.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.compacter.delete({ where: { id } });
  }
}
