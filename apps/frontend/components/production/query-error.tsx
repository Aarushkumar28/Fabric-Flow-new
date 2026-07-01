import { Button } from '@/components/ui/button';

interface Props {
  message: string;
  retry: () => void;
}

export function QueryError({
  message,
  retry,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-rose-500 font-semibold text-sm">
        {message}
      </p>
      <Button
        className="mt-4 bg-rose-600 hover:bg-rose-500 text-xs px-4 py-2"
        onClick={retry}
      >
        Retry
      </Button>
    </div>
  );
}
