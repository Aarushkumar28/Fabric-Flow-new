import { Module } from '@nestjs/common';
import { DyeingProgramsController } from './dyeing-programs.controller';
import { DyeingProgramsService } from './dyeing-programs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DyeingProgramsController],
  providers: [DyeingProgramsService],
  exports: [DyeingProgramsService],
})
export class DyeingProgramsModule {}
