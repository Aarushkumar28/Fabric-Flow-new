import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { KnitterProgramsController } from './knitter-programs.controller';
import { KnitterProgramsService } from './knitter-programs.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [KnitterProgramsController],
  providers: [KnitterProgramsService],
  exports: [KnitterProgramsService],
})
export class KnitterProgramsModule {}
