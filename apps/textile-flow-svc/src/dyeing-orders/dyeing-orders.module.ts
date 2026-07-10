import { Module } from '@nestjs/common';
import { DyeingOrdersController } from './dyeing-orders.controller';
import { DyeingOrdersService } from './dyeing-orders.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DyeingOrdersController],
  providers: [DyeingOrdersService],
  exports: [DyeingOrdersService],
})
export class DyeingOrdersModule {}
