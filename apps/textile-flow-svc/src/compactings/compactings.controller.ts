import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { CompactingsService } from './compactings.service';
import type { CreateCompactingDto } from '@textile-flow/shared';
import { CreateCompactingSchema } from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UpdateCompactingDto } from './dto/update-compacting.dto';

@Controller('compactings')
export class CompactingsController {
  constructor(private readonly service: CompactingsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateCompactingSchema))
    dto: CreateCompactingDto,
  ) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCompactingDto) {
    return this.service.update(+id, dto);
  }
}
