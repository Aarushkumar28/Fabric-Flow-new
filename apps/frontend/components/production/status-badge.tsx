import { Badge } from '@/components/ui/badge';

const styles: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  ISSUED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  IN_PROGRESS: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  COMPLETED: 'bg-green-500/20 text-green-300 border-green-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border-red-500/30',
  HOLD: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

export function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <Badge
      variant="outline"
      className={styles[status] ?? ''}
    >
      {status}
    </Badge>
  );
}
