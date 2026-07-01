'use client';

import { EmptyState } from './empty-state';
import { QueryError } from './query-error';
import { TableSkeleton } from './table-skeleton';

interface Props {
  isLoading: boolean;
  error: unknown;
  retry: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
}

export function QueryStateWrapper({
  isLoading,
  error,
  retry,
  isEmpty = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There is no data to show right now.',
  children,
}: Props) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <QueryError
        message={error instanceof Error ? error.message : 'Failed to load data.'}
        retry={retry}
      />
    );
  }

  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return children;
}
