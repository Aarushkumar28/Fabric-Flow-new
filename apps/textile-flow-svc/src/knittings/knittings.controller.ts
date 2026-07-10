import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { KnittingsService } from './knittings.service';
import type { CreateKnittingDto } from '@textile-flow/shared';
import { CreateKnittingSchema } from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('knittings')
export class KnittingsController {
  constructor(private readonly service: KnittingsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateKnittingSchema)) dto: CreateKnittingDto,
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
}
