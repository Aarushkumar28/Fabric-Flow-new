import { Injectable } from '@nestjs/common';

@Injectable()
export class BalanceService {
  calculateRemaining(total: number, used: number): number {
    return Number((total - used).toFixed(3));
  }

  validateBalance(remaining: number, requested: number): boolean {
    return remaining >= requested;
  }
}
