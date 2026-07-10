import { Module } from '@nestjs/common';
import { CompactersController } from './compacters.controller';
import { CompactersService } from './compacters.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CompactersController],
  providers: [CompactersService],
  exports: [CompactersService],
})
export class CompactersModule {}
