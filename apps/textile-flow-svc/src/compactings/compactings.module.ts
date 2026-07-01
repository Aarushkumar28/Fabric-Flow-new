import { Module } from '@nestjs/common';
import { CompactingsController } from './compactings.controller';
import { CompactingsService } from './compactings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { InventoryModule } from '../inventory/inventory.module';
import { LotTrackerModule } from '../lot-tracker/lot-tracker.module';

@Module({
  imports: [PrismaModule, WorkflowModule, InventoryModule, LotTrackerModule],
  controllers: [CompactingsController],
  providers: [CompactingsService],
  exports: [CompactingsService],
})
export class CompactingsModule {}
