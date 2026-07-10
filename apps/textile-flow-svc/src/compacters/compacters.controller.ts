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
  CreateCompacterSchema,
  UpdateCompacterSchema,
  type CreateCompacterDto,
  type UpdateCompacterDto,
} from '@textile-flow/shared';
import { CompactersService } from './compacters.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('compacters')
export class CompactersController {
  constructor(private readonly compactersService: CompactersService) {}

  @Get()
  findAll() {
    return this.compactersService.findAll();
  }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateCompacterSchema))
  create(@Body() dto: CreateCompacterDto) {
    return this.compactersService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.compactersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateCompacterSchema)) dto: UpdateCompacterDto,
  ) {
    return this.compactersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.compactersService.remove(id);
  }
}
