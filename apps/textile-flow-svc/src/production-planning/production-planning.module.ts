import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { InventoryModule } from '../inventory/inventory.module';

import { LotTrackerModule } from '../lot-tracker/lot-tracker.module';

import { ProductionPlanningService } from './production-planning.service';

import { ProductionPlanningController } from './production-planning.controller';

@Module({
  imports: [PrismaModule, InventoryModule, LotTrackerModule],

  providers: [ProductionPlanningService],

  controllers: [ProductionPlanningController],

  exports: [ProductionPlanningService],
})
export class ProductionPlanningModule {}
