import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GreyFabricInwardController } from './grey-fabric-inward.controller';
import { GreyFabricInwardService } from './grey-fabric-inward.service';

@Module({
  imports: [PrismaModule],
  controllers: [GreyFabricInwardController],
  providers: [GreyFabricInwardService],
  exports: [GreyFabricInwardService],
})
export class GreyFabricInwardModule {}
