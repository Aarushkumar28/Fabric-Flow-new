import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { KnitterProgramsController } from './knitter-programs.controller';
import { KnitterProgramsService } from './knitter-programs.service';

@Module({
  imports: [PrismaModule],
  controllers: [KnitterProgramsController],
  providers: [KnitterProgramsService],
})
export class KnitterProgramsModule {}
