import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('summary')
  async summary() {
    return this.inventoryService.getInventorySummary();
  }

  @Get('history')
  async history(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('itemType') itemType?: string,
    @Query('lotNo') lotNo?: string,
  ) {
    return this.inventoryService.getInventoryHistory({
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
      itemType,
      lotNo,
    });
  }

  @Get('lot/:lotNo')
  async lotBalance(@Param('lotNo') lotNo: string) {
    return {
      lotNo,
      balance: await this.inventoryService.getLotBalance(lotNo),
    };
  }

  @Get('stage/:stage')
  async stageBalance(@Param('stage') stage: string) {
    return {
      stage,
      balance: await this.inventoryService.getStageBalance(stage),
    };
  }

  @Get('reconcile')
  async reconcile() {
    return this.inventoryService.reconcileInventory();
  }

  @Post('snapshot')
  async snapshot() {
    return this.inventoryService.createDailySnapshot();
  }
}
