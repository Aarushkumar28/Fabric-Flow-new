import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  CreateGreyFabricInwardSchema,
  type CreateGreyFabricInwardDto,
} from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { GreyFabricInwardService } from './grey-fabric-inward.service';

@Controller('grey-fabric-inward')
export class GreyFabricInwardController {
  constructor(private readonly service: GreyFabricInwardService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateGreyFabricInwardSchema))
    dto: CreateGreyFabricInwardDto,
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

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
