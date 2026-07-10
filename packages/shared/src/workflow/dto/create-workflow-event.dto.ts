export interface CreateWorkflowEventDto {
  entityType: string;
  entityId: number;
  event: string;
  oldStatus?: string;
  newStatus?: string;
}
