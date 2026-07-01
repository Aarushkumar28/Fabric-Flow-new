// src/workflow/dto/create-workflow.dto.ts
import { IsString, IsEnum } from 'class-validator';
import { WorkflowStatus } from '@textile-flow/shared';

export class CreateWorkflowDto {
  @IsString()
  entityId: string;

  @IsString()
  entityType: string;

  @IsEnum(WorkflowStatus)
  initialStatus: WorkflowStatus;
}
