import { Module } from '@nestjs/common';
import { DyeingsController } from './dyeings.controller';
import { DyeingsService } from './dyeings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { InventoryModule } from '../inventory/inventory.module';
import { LotTrackerModule } from '../lot-tracker/lot-tracker.module';

@Module({
  imports: [PrismaModule, WorkflowModule, InventoryModule, LotTrackerModule],
  controllers: [DyeingsController],
  providers: [DyeingsService],
  exports: [DyeingsService],
})
export class DyeingsModule {}
