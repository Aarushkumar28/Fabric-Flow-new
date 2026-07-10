import { Injectable } from '@nestjs/common';
import { MemosService } from '../memos/memos.service';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowStatus } from '@textile-flow/shared';

type CreateDyeingDispatchBody = {
  dispatchDate?: string;
  dyerId: number;
  remarks?: string;
  lines: { greyFabricLotId: number }[];
};

@Injectable()
export class DyeingDispatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memosService: MemosService,
  ) {}

  async create(dto: CreateDyeingDispatchBody) {
    return this.memosService.create({
      issueDate: dto.dispatchDate,
      dyerId: dto.dyerId,
      remarks: dto.remarks,
      lines: dto.lines.map((line) => ({
        greyFabricLotId: line.greyFabricLotId,
      })),
    });
  }

  async findAll() {
    const memos = await this.prisma.memo.findMany({
      include: {
        dyer: true,
        lines: { include: { greyFabricLot: true, dyeing: true } },
      },
      orderBy: { issueDate: 'desc' },
    });

    return memos.map((memo) => ({
      id: memo.id,
      dispatchDate: memo.issueDate,
      dyerId: memo.dyerId,
      remarks: memo.remarks,
      dyer: memo.dyer,
      lines: memo.lines.map((line) => ({
        id: line.id,
        dispatchId: memo.id,
        greyFabricLotId: line.greyFabricLotId,
        sentWeight: line.sentWeight,
        receivedWeight: line.dyeing?.finalWeight,
        receivedDate: line.dyeing?.updatedAt,
        processLossPercent: line.dyeing?.processLoss,
        status:
          line.dyeing?.status === WorkflowStatus.COMPLETED
            ? WorkflowStatus.RECEIVED
            : line.dyeing?.status === WorkflowStatus.IN_DYEING
              ? WorkflowStatus.SENT
              : WorkflowStatus.SENT,
        greyFabricLot: line.greyFabricLot,
      })),
    }));
  }
}
