import { Module } from '@nestjs/common';
import { InhouseKnittedFabricsController } from './inhouse-knitted-fabrics.controller';
import { InhouseKnittedFabricsService } from './inhouse-knitted-fabrics.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InhouseKnittedFabricsController],
  providers: [InhouseKnittedFabricsService],
  exports: [InhouseKnittedFabricsService],
})
export class InhouseKnittedFabricsModule {}
