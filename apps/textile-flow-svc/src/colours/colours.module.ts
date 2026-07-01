import { Module } from '@nestjs/common';
import { ColoursController } from './colours.controller';
import { ColoursService } from './colours.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ColoursController],
  providers: [ColoursService],
  exports: [ColoursService],
})
export class ColoursModule {}
