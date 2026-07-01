import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { KnittingLotsService } from './knitting-lots.service';

@Controller('knitting-lots')
export class KnittingLotsController {
  constructor(private readonly service: KnittingLotsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
