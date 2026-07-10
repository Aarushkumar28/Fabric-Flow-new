import { Controller, Get, Query } from '@nestjs/common';
import { GreyFabricLotsService } from './grey-fabric-lots.service';

@Controller('grey-fabric-lots')
export class GreyFabricLotsController {
  constructor(private readonly greyFabricLotsService: GreyFabricLotsService) {}

  @Get()
  findAll(@Query('status') status?: string, @Query('source') source?: string) {
    return this.greyFabricLotsService.findAll(status, source);
  }
}
