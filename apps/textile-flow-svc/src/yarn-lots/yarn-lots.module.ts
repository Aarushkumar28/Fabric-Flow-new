import { Module } from '@nestjs/common';
import { YarnLotsController } from './yarn-lots.controller';
import { YarnLotsService } from './yarn-lots.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [YarnLotsController],
  providers: [YarnLotsService],
  exports: [YarnLotsService],
})
export class YarnLotsModule {}
