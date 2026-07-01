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
  CreateKnitterSchema,
  UpdateKnitterSchema,
  type CreateKnitterDto,
  type UpdateKnitterDto,
} from '@textile-flow/shared';
import { KnittersService } from './knitters.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('knitters')
export class KnittersController {
  constructor(private readonly knittersService: KnittersService) {}

  @Get()
  findAll() {
    return this.knittersService.findAll();
  }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateKnitterSchema))
  create(@Body() dto: CreateKnitterDto) {
    return this.knittersService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.knittersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateKnitterSchema)) dto: UpdateKnitterDto,
  ) {
    return this.knittersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.knittersService.remove(id);
  }
}
