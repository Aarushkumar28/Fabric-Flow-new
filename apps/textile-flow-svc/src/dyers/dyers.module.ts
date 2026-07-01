import { Module } from '@nestjs/common';
import { DyersController } from './dyers.controller';
import { DyersService } from './dyers.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DyersController],
  providers: [DyersService],
  exports: [DyersService],
})
export class DyersModule {}
