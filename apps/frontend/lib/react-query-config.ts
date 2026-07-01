export const QUERY_CONFIG = {
  dashboard: {
    staleTime: 10_000,
    gcTime: 300_000,
    refetchInterval: 15_000,
    retry: 2,
    refetchOnWindowFocus: false,
  },

  execution: {
    staleTime: 5_000,
    gcTime: 300_000,
    refetchInterval: 10_000,
    retry: 2,
    refetchOnWindowFocus: false,
  },

  tables: {
    staleTime: 30_000,
    gcTime: 300_000,
    refetchInterval: false,
    retry: 1,
    refetchOnWindowFocus: false,
  },
} as const;
