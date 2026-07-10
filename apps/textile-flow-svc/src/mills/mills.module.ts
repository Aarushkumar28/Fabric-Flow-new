import { Module } from '@nestjs/common';
import { MillsController } from './mills.controller';
import { MillsService } from './mills.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MillsController],
  providers: [MillsService],
})
export class MillsModule {}
