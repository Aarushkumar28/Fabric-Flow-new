import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  ParseIntPipe,
  UsePipes,
} from '@nestjs/common';
import {
  CreateDyerSchema,
  UpdateDyerSchema,
  type CreateDyerDto,
  type UpdateDyerDto,
} from '@textile-flow/shared';
import { DyersService } from './dyers.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('dyers')
export class DyersController {
  constructor(private readonly dyersService: DyersService) {}

  @Get()
  findAll() {
    return this.dyersService.findAll();
  }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateDyerSchema))
  create(@Body() dto: CreateDyerDto) {
    return this.dyersService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dyersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateDyerSchema)) dto: UpdateDyerDto,
  ) {
    return this.dyersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.dyersService.remove(id);
  }
}
