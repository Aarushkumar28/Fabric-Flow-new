export interface ProductionPlan {
  id: number;
  planNo: string;
  lotNo: string;
  stage: string;
  status: string;
  delayed: boolean;
  plannedWeight: number;
  completedWeight: number;
  plannedDate: string;
}

export type ProductionEventType =
  | 'PLAN_CREATED'
  | 'PLAN_UPDATED'
  | 'PLAN_CANCELLED';

export interface ProductionEvent {
  id: number;
  productionPlanId: number | null;
  eventType: ProductionEventType;
  message: string;
  metadata: unknown | null;
  createdAt: string;
}

export interface ProductionSummary {
  totalPlans: number;
  completedPlans: number;
  delayedPlans: number;
  inProgressPlans: number;
  plannedWeight: number;
  completedWeight: number;
  efficiency: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CancelPlanPayload {
  id: number;
}

export interface CreateProductionPlanPayload {
  lotNo: string;
  stage: string;
  plannedWeight: number;
  plannedDate: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  remarks?: string;
}
