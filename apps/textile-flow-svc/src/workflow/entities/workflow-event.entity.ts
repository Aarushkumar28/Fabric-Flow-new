// src/workflow/entities/workflow-event.entity.ts
import { WorkflowStatus } from '@textile-flow/shared';

export class WorkflowEventEntity {
  id: number;
  entityId: string;
  entityType: string;
  status: WorkflowStatus;
  payload: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: {
    id: number;
    entityId: string;
    entityType: string;
    status: string;
    payload: unknown;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.entityId = data.entityId;
    this.entityType = data.entityType;
    this.status = data.status as WorkflowStatus;
    this.payload = (data.payload as Record<string, unknown>) ?? null;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
