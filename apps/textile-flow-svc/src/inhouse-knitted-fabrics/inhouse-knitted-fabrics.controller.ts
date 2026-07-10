import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { InhouseKnittedFabricsService } from './inhouse-knitted-fabrics.service';
import type { CreateInhouseKnittedFabricDto } from '@textile-flow/shared';
import { CreateInhouseKnittedFabricSchema } from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('inhouse-knitted-fabrics')
export class InhouseKnittedFabricsController {
  constructor(private readonly service: InhouseKnittedFabricsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateInhouseKnittedFabricSchema))
    dto: CreateInhouseKnittedFabricDto,
  ) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
