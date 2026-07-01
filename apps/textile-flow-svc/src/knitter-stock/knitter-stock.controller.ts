import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { KnitterStockService } from './knitter-stock.service';

@Controller('knitter-stock')
export class KnitterStockController {
  constructor(private readonly knitterStockService: KnitterStockService) {}

  @Get('knitter/:knitterId')
  findByKnitter(@Param('knitterId', ParseIntPipe) knitterId: number) {
    return this.knitterStockService.findByKnitter(knitterId);
  }
}
