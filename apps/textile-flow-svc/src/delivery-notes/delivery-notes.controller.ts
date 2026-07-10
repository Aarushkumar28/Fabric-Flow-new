import { Controller, Get, Post, Body } from '@nestjs/common';
import { DeliveryNotesService } from './delivery-notes.service';
import type { CreateDeliveryNoteDto } from '@textile-flow/shared';
import { CreateDeliveryNoteSchema } from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('delivery-notes')
export class DeliveryNotesController {
  constructor(private readonly service: DeliveryNotesService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateDeliveryNoteSchema))
    dto: CreateDeliveryNoteDto,
  ) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
