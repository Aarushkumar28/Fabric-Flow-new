import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  ParseFloatPipe,
} from '@nestjs/common';
import { YarnLotsService } from './yarn-lots.service';
import type { CreateYarnLotDto, UpdateYarnLotDto } from '@textile-flow/shared';
import { CreateYarnLotSchema, UpdateYarnLotSchema } from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('yarn-lots')
export class YarnLotsController {
  constructor(private readonly service: YarnLotsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateYarnLotSchema)) dto: CreateYarnLotDto,
  ) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('hfCode') hfCode?: string,
    @Query('knitterId') knitterId?: string,
  ) {
    const knitterIdNum = knitterId ? parseInt(knitterId, 10) : undefined;
    return this.service.findAll({ hfCode, knitterId: knitterIdNum });
  }

  @Get('hf/:hfCode')
  findByHf(@Param('hfCode') hfCode: string) {
    return this.service.findByHfCode(hfCode);
  }

  @Get('po/:purchaseOrderNo')
  findByPurchaseOrder(@Param('purchaseOrderNo') purchaseOrderNo: string) {
    return this.service.findByPurchaseOrderNo(purchaseOrderNo);
  }

  @Get('list/hf-codes')
  listHfCodes() {
    return this.service.listHfCodes();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateYarnLotSchema)) dto: UpdateYarnLotDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Post(':id/issue')
  issue(
    @Param('id', ParseIntPipe) id: number,
    @Body('knitterId', ParseIntPipe) knitterId: number,
    @Body('weight', ParseFloatPipe) weight: number,
  ) {
    return this.service.issue(id, knitterId, weight);
  }
}
