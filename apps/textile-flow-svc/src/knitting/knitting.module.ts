import { Module } from '@nestjs/common';
import { KnittingService } from './knitting.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { InventoryModule } from '../inventory/inventory.module';
import { LotTrackerModule } from '../lot-tracker/lot-tracker.module';

@Module({
  imports: [PrismaModule, WorkflowModule, InventoryModule, LotTrackerModule],
  providers: [KnittingService],
  exports: [KnittingService],
})
export class KnittingModule {}
