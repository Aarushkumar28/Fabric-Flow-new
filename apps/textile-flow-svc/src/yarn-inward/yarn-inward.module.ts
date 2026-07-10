import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { YarnInwardController } from './yarn-inward.controller';
import { YarnInwardService } from './yarn-inward.service';
import { InventoryModule } from '../inventory/inventory.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [PrismaModule, InventoryModule, ActivityLogsModule],
  controllers: [YarnInwardController],
  providers: [YarnInwardService],
  exports: [YarnInwardService],
})
export class YarnInwardModule {}
