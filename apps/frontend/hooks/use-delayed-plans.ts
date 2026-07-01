import { useQuery } from '@tanstack/react-query';
import { getDelayedPlans } from '@/lib/api/production';
import { QUERY_KEYS } from '@/lib/query-keys';
import { QUERY_CONFIG } from '@/lib/react-query-config';

export function useDelayedPlans() {
  return useQuery({
    queryKey: [...QUERY_KEYS.dashboard, 'delayed'],
    queryFn: getDelayedPlans,
    ...QUERY_CONFIG.dashboard,
  });
}
