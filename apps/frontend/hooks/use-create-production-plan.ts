import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createProductionPlan } from '@/lib/api/production';
import { QUERY_KEYS } from '@/lib/query-keys';
import { CreateProductionPlanPayload } from '@/types/production';

export function useCreateProductionPlan(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductionPlanPayload) =>
      createProductionPlan(payload),

    onSuccess: () => {
      toast.success('Production plan created');

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.plans });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });

      onSuccess?.();
    },

    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create production plan',
      );
    },
  });
}
