import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AutofillService {
  constructor(private readonly prisma: PrismaService) {}

  async getYarnLotDetails(hfCode: string) {
    return this.prisma.yarnLot.findFirst({
      where: { hfCode },
      include: { mill: true },
    });
  }

  async getGreyLotDetails(lotNumber: string) {
    return this.prisma.greyFabricLot.findFirst({
      where: { lotNumber },
      include: { knitterProgram: true },
    });
  }

  async getMemoDetails(memoId: number) {
    return this.prisma.memo.findUnique({
      where: { id: memoId },
      include: { lines: true },
    });
  }

  async getDyeingDetails(dyeingId: number) {
    return this.prisma.dyeing.findUnique({
      where: { id: dyeingId },
    });
  }
}
