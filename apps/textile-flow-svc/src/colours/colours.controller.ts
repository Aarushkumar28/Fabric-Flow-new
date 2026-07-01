import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  ParseIntPipe,
} from '@nestjs/common';
import * as Shared from '@textile-flow/shared';
import { ColoursService } from './colours.service';

@Controller('colours')
export class ColoursController {
  constructor(private readonly coloursService: ColoursService) {}

  @Get()
  findAll() {
    return this.coloursService.findAll();
  }

  @Post()
  create(@Body() dto: Shared.CreateColourDto) {
    return this.coloursService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coloursService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Shared.UpdateColourDto,
  ) {
    return this.coloursService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.coloursService.remove(id);
  }
}
