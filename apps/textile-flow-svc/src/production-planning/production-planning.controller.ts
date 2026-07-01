import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Delete,
} from '@nestjs/common';

import { ProductionPlanningService } from './production-planning.service';

import { CreateProductionPlanDto } from './dto/create-production-plan.dto';

import { UpdateProductionPlanDto } from './dto/update-production-plan.dto';

@Controller('production-planning')
export class ProductionPlanningController {
  constructor(
    private readonly productionPlanningService: ProductionPlanningService,
  ) {}

  @Post()
  async createPlan(
    @Body()
    dto: CreateProductionPlanDto,
  ) {
    return this.productionPlanningService.createPlan(dto);
  }

  @Patch(':id')
  async updatePlan(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateProductionPlanDto,
  ) {
    return this.productionPlanningService.updatePlan(Number(id), dto);
  }

  @Get('today')
  async todayPlans() {
    return this.productionPlanningService.getTodayPlans();
  }

  @Get('delayed')
  async delayedPlans() {
    return this.productionPlanningService.getDelayedPlans();
  }

  @Get('summary')
  async summary() {
    return this.productionPlanningService.getSummary();
  }

  @Get('events')
  async events() {
    return this.productionPlanningService.getEvents();
  }

  @Get()
  async plans(
    @Query('page')
    page?: string,

    @Query('limit')
    limit?: string,

    @Query('status')
    status?: string,

    @Query('stage')
    stage?: string,
  ) {
    return this.productionPlanningService.getPlans({
      page: Number(page ?? 1),

      limit: Number(limit ?? 20),

      status,

      stage,
    });
  }

  @Delete(':id')
  async cancelPlan(
    @Param('id')
    id: string,
  ) {
    return this.productionPlanningService.cancelPlan(Number(id));
  }
}
