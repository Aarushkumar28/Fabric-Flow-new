interface Props {
  title: string;

  description: string;
}

export function EmptyState({ title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>

      <p className="text-muted-foreground mt-2">{description}</p>
    </div>
  );
}
