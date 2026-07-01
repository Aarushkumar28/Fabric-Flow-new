import { Module } from '@nestjs/common';
import { KnittingLotsController } from './knitting-lots.controller';
import { KnittingLotsService } from './knitting-lots.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KnittingLotsController],
  providers: [KnittingLotsService],
  exports: [KnittingLotsService],
})
export class KnittingLotsModule {}
