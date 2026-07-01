import { Module } from '@nestjs/common';
import { KnitterStockController } from './knitter-stock.controller';
import { KnitterStockService } from './knitter-stock.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KnitterStockController],
  providers: [KnitterStockService],
  exports: [KnitterStockService],
})
export class KnitterStockModule {}
