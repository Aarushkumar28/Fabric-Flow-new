import { Module } from '@nestjs/common';
import { KnittingsController } from './knittings.controller';
import { KnittingsService } from './knittings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [KnittingsController],
  providers: [KnittingsService],
  exports: [KnittingsService],
})
export class KnittingsModule {}
