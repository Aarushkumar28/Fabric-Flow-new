import { Module } from '@nestjs/common';
import { LotTrackerService } from './lot-tracker.service';
import { LotTrackerController } from './lot-tracker.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [LotTrackerController],
  providers: [LotTrackerService],
  exports: [LotTrackerService],
})
export class LotTrackerModule {}
