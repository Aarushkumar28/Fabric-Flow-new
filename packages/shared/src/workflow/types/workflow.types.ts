import { WorkflowStatus } from '../enums/workflow-status.enum';

export interface WorkflowTransition {
  entityType: string;
  entityId: number;
  oldStatus: WorkflowStatus;
  newStatus: WorkflowStatus;
}

export interface WorkflowAudit {
  entityType: string;
  entityId: number;
  action: string;
  createdAt: Date;
}
