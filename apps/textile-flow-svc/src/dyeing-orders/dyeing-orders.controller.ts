import { Controller, Get, Post, Body } from '@nestjs/common';
import { DyeingOrdersService } from './dyeing-orders.service';
import type { CreateDyeingOrderDto } from '@textile-flow/shared';
import { CreateDyeingOrderSchema } from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('dyeing-orders')
export class DyeingOrdersController {
  constructor(private readonly service: DyeingOrdersService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateDyeingOrderSchema))
    dto: CreateDyeingOrderDto,
  ) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
