import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto, PurchaseOrderItemDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Auto-generates the next sequential PO number server-side.
   * Format: PO-0001, PO-0002 … (or FPO-0001 for Fabric POs)
   *
   * NOTE: Uses findFirst with ORDER BY createdAt DESC — appropriate for an
   * internal low-concurrency tool. For strict atomic uniqueness under
   * concurrent load, replace with a Postgres SEQUENCE.
   */
  private async generateNextPoNumber(poType?: string): Promise<string> {
    const prefix = poType === 'GREY_FABRIC' ? 'FPO' : 'PO';
    const lastPo = await this.prisma.purchaseOrder.findFirst({
      where: { poNumber: { startsWith: `${prefix}-` } },
      orderBy: { createdAt: 'desc' },
    });
    let nextSeq = 1;
    if (lastPo) {
      const match = lastPo.poNumber.match(/(\d+)$/);
      if (match) nextSeq = parseInt(match[1], 10) + 1;
    }
    return `${prefix}-${String(nextSeq).padStart(4, '0')}`;
  }

  async create(dto: CreatePurchaseOrderDto) {
    const {
      items,
      date,
      deliveryDate,
      poType,
      deliveryName,
      deliveryAddress,
      deliveryGST,
      fabricType,
      fabricColour,
      fabricDia,
      fabricGsm,
      totalFabricWeight,
      millId,
      knitterId,
      fbNo,
      ...rest
    } = dto;

    // ── Issue 4: Enforce unique HF Code ──────────────────────────────────────
    if (rest.hfCode) {
      const existingHf = await this.prisma.purchaseOrder.findFirst({
        where: { hfCode: rest.hfCode },
      });
      if (existingHf) {
        throw new BadRequestException(
          `HF Code "${rest.hfCode}" is already used on PO ${existingHf.poNumber}`,
        );
      }
    }

    // ── Issue 9: Enforce unique FB No. for Fabric POs ────────────────────────
    if (poType === 'GREY_FABRIC' && fbNo) {
      const existingFb = await this.prisma.purchaseOrder.findFirst({
        where: { fbNo, poType: 'GREY_FABRIC' },
      });
      if (existingFb) {
        throw new BadRequestException(
          `FB No. "${fbNo}" is already used on PO ${existingFb.poNumber}`,
        );
      }
    }

    // ── Issue 7: Auto-generate sequential PO number ──────────────────────────
    const poNumber = await this.generateNextPoNumber(poType);

    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          ...rest,
          poNumber,
          fbNo: fbNo ?? null,
          date: new Date(date),
          deliveryDate: new Date(deliveryDate),
          poType: poType || 'YARN',
          deliveryName,
          deliveryAddress,
          deliveryGST,
          fabricType,
          fabricColour,
          fabricDia,
          fabricGsm,
          totalFabricWeight,
          items: {
            create: items.map((item) => ({
              description: item.description,
              count: item.count,
              quality: item.quality,
              bags: item.bags,
              bagWeight: item.bagWeight,
              totalWeight: item.totalWeight,
              rate: item.rate,
              cgst: item.cgst,
              sgst: item.sgst,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // ── Auto-create YarnInward from PO ────────────────────────────────────
      let inwardLinkWarning: string | null = null;

      if (!poType || poType === 'YARN') {
        const firstItem = items[0];

        const mill = dto.millId
          ? await tx.mill.findUnique({ where: { id: dto.millId } })
          : await tx.mill.findFirst({
              where: { name: { contains: rest.supplierName ?? '', mode: 'insensitive' } },
            });

        const knitter = dto.knitterId
          ? await tx.knitter.findUnique({ where: { id: dto.knitterId } })
          : dto.deliveryName
          ? await tx.knitter.findFirst({
              where: { name: { contains: dto.deliveryName, mode: 'insensitive' } },
            })
          : null;

        if (mill && knitter && firstItem) {
          const bags = firstItem.bags ?? 0;
          const bagWeight = firstItem.bagWeight ?? 60;
          const totalWeight = bags * bagWeight;
          const rate = firstItem.rate ?? 0;
          const cgst = firstItem.cgst ?? 2.5;
          const sgst = firstItem.sgst ?? 2.5;
          const taxable = totalWeight * rate;
          const cgstAmt = taxable * (cgst / 100);
          const sgstAmt = taxable * (sgst / 100);

          await tx.yarnInward.create({
            data: {
              status:            'PENDING',
              purchaseOrderId:   po.id,
              receiptDate:       new Date(dto.deliveryDate),
              millId:            mill.id,
              deliveryKnitterId: knitter.id,
              hfBatch:           po.hfCode,
              yarnCount:         firstItem.count ?? null,
              yarnQuality:       firstItem.quality ?? null,
              numBags:           bags,
              bagWeight:         bagWeight,
              totalWeight:       totalWeight,
              ratePerKg:         rate,
              cgstRate:          cgst,
              sgstRate:          sgst,
              cgstAmount:        cgstAmt,
              sgstAmount:        sgstAmt,
              totalCost:         taxable + cgstAmt + sgstAmt,
              purchaseAccount:   'C.N.T.LLP',
              receivedWeight:    null,
              millInvoiceNo:     null,
              millDcNo:          null,
            },
          });
        } else {
          const missingParts: string[] = [];
          if (!mill) missingParts.push(`mill not found for "${rest.supplierName}" (try passing millId)`);
          if (!knitter) missingParts.push(`knitter not found for "${dto.deliveryName ?? 'no delivery name'}" (try passing knitterId)`);
          if (!firstItem) missingParts.push('no items in PO');
          inwardLinkWarning = `YarnInward auto-link skipped: ${missingParts.join('; ')}`;
          console.warn('[PurchaseOrdersService] create() —', inwardLinkWarning);
        }
      }

      return { ...po, inwardLinkWarning };
    });
  }

  async findAll() {
    return this.prisma.purchaseOrder.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!po) {
      throw new NotFoundException(`Purchase Order with id "${id}" not found`);
    }
    return po;
  }

  async update(id: string, dto: UpdatePurchaseOrderDto) {
    await this.findOne(id);

    const {
      items,
      date,
      deliveryDate,
      poType,
      deliveryName,
      deliveryAddress,
      deliveryGST,
      fabricType,
      fabricColour,
      fabricDia,
      fabricGsm,
      totalFabricWeight,
      ...rest
    } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (items !== undefined) {
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: id },
        });
      }

      const po = await tx.purchaseOrder.update({
        where: { id },
        data: {
          ...rest,
          ...(date !== undefined && { date: new Date(date) }),
          ...(deliveryDate !== undefined && { deliveryDate: new Date(deliveryDate) }),
          ...(poType !== undefined && { poType }),
          ...(deliveryName !== undefined && { deliveryName }),
          ...(deliveryAddress !== undefined && { deliveryAddress }),
          ...(deliveryGST !== undefined && { deliveryGST }),
          ...(fabricType !== undefined && { fabricType }),
          ...(fabricColour !== undefined && { fabricColour }),
          ...(fabricDia !== undefined && { fabricDia }),
          ...(fabricGsm !== undefined && { fabricGsm }),
          ...(totalFabricWeight !== undefined && { totalFabricWeight }),
          ...(items !== undefined && {
            items: {
              create: items.map((item: PurchaseOrderItemDto) => ({
                description: item.description,
                count: item.count,
                quality: item.quality,
                bags: item.bags,
                bagWeight: item.bagWeight,
                totalWeight: item.totalWeight,
                rate: item.rate,
                cgst: item.cgst,
                sgst: item.sgst,
              })),
            },
          }),
        },
        include: {
          items: true,
        },
      });

      return po;
    });
  }

  // ── Issue 8: Cancel PO ───────────────────────────────────────────────────
  async cancel(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('Purchase Order not found');
    if (po.status === 'CANCELLED') {
      throw new BadRequestException('This PO is already cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedPo = await tx.purchaseOrder.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Reflect in the linked YarnInward if it hasn't been received yet
      const linkedInward = await tx.yarnInward.findFirst({
        where: { purchaseOrderId: id },
      });
      if (linkedInward) {
        if (linkedInward.status === 'RECEIVED') {
          throw new BadRequestException(
            'Cannot cancel this PO — yarn has already been received against it. ' +
            'Cancel is only allowed while status is PENDING.',
          );
        }
        await tx.yarnInward.update({
          where: { id: linkedInward.id },
          data: { status: 'CANCELLED' },
        });
      }

      return updatedPo;
    });
  }

  async remove(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) {
      throw new NotFoundException('Purchase Order not found');
    }
    return this.prisma.purchaseOrder.delete({
      where: { id },
    });
  }
}
