import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  CreateYarnInwardSchema,
  UpdateYarnInwardSchema,
  type CreateYarnInwardDto,
  type UpdateYarnInwardDto,
} from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { YarnInwardService } from './yarn-inward.service';

@Controller('yarn-inward')
export class YarnInwardController {
  constructor(private readonly service: YarnInwardService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateYarnInwardSchema))
    dto: CreateYarnInwardDto,
  ) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateYarnInwardSchema))
    dto: UpdateYarnInwardDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
