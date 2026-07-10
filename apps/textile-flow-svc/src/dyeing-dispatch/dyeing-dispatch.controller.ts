import { Body, Controller, Get, Post } from '@nestjs/common';
import { DyeingDispatchService } from './dyeing-dispatch.service';

@Controller('dyeing-dispatch')
export class DyeingDispatchController {
  constructor(private readonly service: DyeingDispatchService) {}

  @Post()
  create(@Body() body: Parameters<DyeingDispatchService['create']>[0]) {
    return this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
