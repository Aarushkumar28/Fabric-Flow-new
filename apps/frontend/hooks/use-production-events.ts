import { useQuery } from '@tanstack/react-query';
import { getProductionEvents } from '@/lib/api/production';
import { QUERY_KEYS } from '@/lib/query-keys';
import { QUERY_CONFIG } from '@/lib/react-query-config';

export function useProductionEvents() {
  return useQuery({
    queryKey: QUERY_KEYS.events,
    queryFn: getProductionEvents,
    ...QUERY_CONFIG.execution,
  });
}
