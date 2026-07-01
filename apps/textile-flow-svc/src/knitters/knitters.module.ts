import { Module } from '@nestjs/common';
import { KnittersController } from './knitters.controller';
import { KnittersService } from './knitters.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KnittersController],
  providers: [KnittersService],
  exports: [KnittersService],
})
export class KnittersModule {}
