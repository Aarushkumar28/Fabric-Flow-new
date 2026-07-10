import { Module } from '@nestjs/common';
import { GreyFabricLotsController } from './grey-fabric-lots.controller';
import { GreyFabricLotsService } from './grey-fabric-lots.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GreyFabricLotsController],
  providers: [GreyFabricLotsService],
  exports: [GreyFabricLotsService],
})
export class GreyFabricLotsModule {}
