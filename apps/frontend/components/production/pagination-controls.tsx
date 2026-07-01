import { Button } from '@/components/ui/button';

interface Props {
  page: number;
  totalPages: number;
  onNext: () => void;
  onPrevious: () => void;
}

export function PaginationControls({
  page,
  totalPages,
  onNext,
  onPrevious,
}: Props) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-4">
      <Button
        variant="outline"
        disabled={page <= 1}
        onClick={onPrevious}
        className="border-slate-800 text-slate-400 hover:bg-slate-800 text-xs px-4 py-2"
      >
        Previous
      </Button>

      <div className="text-slate-500 text-xs font-medium">
        Page {page} of {totalPages}
      </div>

      <Button
        variant="outline"
        disabled={page >= totalPages}
        onClick={onNext}
        className="border-slate-800 text-slate-400 hover:bg-slate-800 text-xs px-4 py-2"
      >
        Next
      </Button>
    </div>
  );
}
