import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKnittingDto } from '@textile-flow/shared';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class KnittingsService {
  private readonly logger = new Logger(KnittingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(dto: CreateKnittingDto) {
    return this.prisma.$transaction(async (tx) => {
      for (const usage of dto.yarnUsages) {
        if (usage.quantity <= 0) {
          throw new BadRequestException('Yarn usage must be greater than zero');
        }

        const stock = await tx.knitterStock.findFirst({
          where: {
            knitterId: dto.knitterNameId,
            yarnLotId: usage.yarnLotId,
            remainingWeight: { gte: usage.quantity },
          },
        });
        if (!stock) {
          throw new BadRequestException(
            `Insufficient stock for lot ${usage.yarnLotId}`,
          );
        }

        await tx.knitterStock.update({
          where: { id: stock.id },
          data: { remainingWeight: { decrement: usage.quantity } },
        });
      }

      const colour = await tx.colour.findFirst({ orderBy: { id: 'asc' } });
      if (!colour) {
        throw new BadRequestException('At least one colour is required');
      }

      const knitting = await tx.knitting.create({
        data: {
          dcNo: dto.dcNo,
          knitterNameId: dto.knitterNameId,
          totalYarnQty: dto.totalYarnQty,
          loopLength: dto.loopLength?.toString(),
          dia: dto.dia?.toString(),
          count: dto.count,
          gauge: dto.gauge,
          fabricDescriptionId: dto.fabricDescriptionId,
          greyFabricWeight: dto.greyFabricWeight,
          receivedWeight: dto.receivedWeight,
          noOfRolls: dto.noOfRolls,
          dateGiven: dto.dateGiven ? new Date(dto.dateGiven) : new Date(),
        },
      });

      for (const usage of dto.yarnUsages) {
        await tx.knittingYarnUsage.create({
          data: {
            knittingId: knitting.id,
            yarnLotId: usage.yarnLotId,
            hfCode: usage.hfCode,
            quantity: usage.quantity,
          },
        });
      }

      const lotNo = `KL-${knitting.id}`;
      const knittingLot = await tx.knittingLot.create({
        data: {
          lotNo,
          knittingId: knitting.id,
          dyerNameId: null,
          noOfRolls: dto.noOfRolls,
          jobWorkNo: null,
          entries: {
            create: {
              colourId: colour.id,
              weight: dto.greyFabricWeight,
            },
          },
        },
      });

      await tx.greyFabricLot.create({
        data: {
          lotNumber: lotNo,
          knitterId: dto.knitterNameId,
          greyWeight: dto.greyFabricWeight,
          rollCount: dto.noOfRolls,
          source: 'KNITTED',
          status: 'AVAILABLE',
        },
      });

      await tx.auditLog.create({
        data: {
          tableName: 'knittings',
          recordId: String(knitting.id),
          action: 'CREATE',
          oldData: undefined,
          newData: {
            knittingId: knitting.id,
            knittingLotId: knittingLot.id,
            greyWeight: dto.greyFabricWeight,
            yarnUsages: dto.yarnUsages,
          },
          performedBy: 'system',
        },
      });

      await this.inventoryService.postInventoryMovement(
        {
          entityType: 'Knitting',
          entityId: knitting.id,
          itemType: 'YARN',
          outwardWeight: knitting.totalYarnQty,
          referenceNo: knitting.dcNo ?? undefined,
          remarks: 'Yarn issued for knitting',
        },
        tx,
      );

      return tx.knitting.findUnique({
        where: { id: knitting.id },
        include: {
          knitter: true,
          knittingYarnUsages: { include: { yarnLot: true } },
          knittingLots: { include: { entries: { include: { colour: true } } } },
        },
      });
    });
  }

  async findAll() {
    return this.prisma.knitting.findMany({
      include: {
        knitter: true,
        knittingYarnUsages: { include: { yarnLot: true } },
        knittingLots: { include: { entries: { include: { colour: true } } } },
      },
      orderBy: { dateGiven: 'desc' },
    });
  }

  async findOne(id: number) {
    const knitting = await this.prisma.knitting.findUnique({
      where: { id },
      include: {
        knitter: true,
        knittingYarnUsages: { include: { yarnLot: true } },
        knittingLots: { include: { entries: { include: { colour: true } } } },
      },
    });
    if (!knitting) throw new NotFoundException('Knitting not found');
    return knitting;
  }
}
