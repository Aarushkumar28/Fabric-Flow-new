import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { cancelPlan } from '@/lib/api/production';
import { QUERY_KEYS } from '@/lib/query-keys';
import { CancelPlanPayload } from '@/types/production';

export function useCancelPlan(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CancelPlanPayload) => cancelPlan(payload),

    onSuccess: () => {
      toast.success('Production plan cancelled');

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.plans });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });

      onSuccess?.();
    },

    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to cancel production plan',
      );
    },
  });
}
