import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { MemosService } from './memos.service';
import type { CreateMemoDto } from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateMemoSchema } from '@textile-flow/shared';

@Controller('memos')
export class MemosController {
  constructor(private readonly service: MemosService) {}

  @Post()
  create(@Body(new ZodValidationPipe(CreateMemoSchema)) dto: CreateMemoDto) {
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
