import { Module } from '@nestjs/common';
import { MemosModule } from '../memos/memos.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DyeingDispatchController } from './dyeing-dispatch.controller';
import { DyeingDispatchService } from './dyeing-dispatch.service';

@Module({
  imports: [PrismaModule, MemosModule],
  controllers: [DyeingDispatchController],
  providers: [DyeingDispatchService],
})
export class DyeingDispatchModule {}
