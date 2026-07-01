import { Injectable } from '@nestjs/common';
import { WorkflowEventsService } from './workflow-events.service';

@Injectable()
export class WorkflowTransitionService {
  constructor(private readonly workflowEvents: WorkflowEventsService) {}

  async transition(
    entityType: string,
    entityId: number,
    oldStatus: string,
    newStatus: string,
  ) {
    await this.workflowEvents.log({
      entityType,
      entityId,
      event: 'STATUS_CHANGED',
      oldStatus,
      newStatus,
    });

    return {
      oldStatus,
      newStatus,
    };
  }
}
