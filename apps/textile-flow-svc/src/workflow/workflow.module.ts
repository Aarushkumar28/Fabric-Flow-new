import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkflowStatusService } from './workflow-status.service';
import { WorkflowTransitionService } from './workflow-transition.service';
import { WorkflowEventsService } from './workflow-events.service';
import { BalanceService } from './balance.service';
import { AutofillService } from './autofill.service';

@Module({
  imports: [PrismaModule],
  providers: [
    WorkflowStatusService,
    WorkflowTransitionService,
    WorkflowEventsService,
    BalanceService,
    AutofillService,
  ],
  exports: [
    WorkflowStatusService,
    WorkflowTransitionService,
    WorkflowEventsService,
    BalanceService,
    AutofillService,
  ],
})
export class WorkflowModule {}
