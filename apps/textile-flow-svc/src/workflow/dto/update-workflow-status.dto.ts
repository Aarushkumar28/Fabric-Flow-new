// src/workflow/dto/update-workflow-status.dto.ts
import { IsEnum } from 'class-validator';
import { WorkflowStatus } from '@textile-flow/shared';

export class UpdateWorkflowStatusDto {
  @IsEnum(WorkflowStatus)
  status: WorkflowStatus;
}
