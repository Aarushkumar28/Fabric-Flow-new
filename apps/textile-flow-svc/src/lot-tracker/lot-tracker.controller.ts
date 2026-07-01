import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { LotTrackerService } from './lot-tracker.service';

@Controller('lot-tracker')
export class LotTrackerController {
  constructor(private readonly lotTrackerService: LotTrackerService) {}

  /** GET /lot-tracker/dashboard/summary */
  @Get('dashboard/summary')
  dashboardSummary() {
    return this.lotTrackerService.getDashboardSummary();
  }

  /** GET /lot-tracker/delayed */
  @Get('delayed')
  findDelayed() {
    return this.lotTrackerService.findDelayed();
  }

  /** GET /lot-tracker/stage/:stage */
  @Get('stage/:stage')
  findByStage(@Param('stage') stage: string) {
    return this.lotTrackerService.findByStage(stage);
  }

  /**
   * GET /lot-tracker
   * Query params: page, limit, status, delayed
   */
  @Get()
  allLots(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('delayed') delayed?: string,
  ) {
    return this.lotTrackerService.getAllLots({
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
      status,
      delayed:
        delayed === 'true' ? true : delayed === 'false' ? false : undefined,
    });
  }

  /** GET /lot-tracker/:lotNo/history */
  @Get(':lotNo/history')
  history(@Param('lotNo') lotNo: string) {
    return this.lotTrackerService.getLotHistory(lotNo);
  }

  /** GET /lot-tracker/:lotNo */
  @Get(':lotNo')
  findOne(@Param('lotNo') lotNo: string) {
    return this.lotTrackerService.findByLotNo(lotNo);
  }

  /** POST /lot-tracker/evaluate/:lotNo */
  @Post('evaluate/:lotNo')
  evaluate(@Param('lotNo') lotNo: string) {
    return this.lotTrackerService.evaluateLot(lotNo);
  }

  /** POST /lot-tracker/reconcile — re-evaluate every known lot */
  @Post('reconcile')
  reconcileLots() {
    return this.lotTrackerService.reconcileAllLots();
  }

  /** POST /lot-tracker/cleanup — remove orphan tracker records */
  @Post('cleanup')
  cleanup() {
    return this.lotTrackerService.cleanupOrphanTrackers();
  }
}
