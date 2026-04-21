interface EmptyStateProps {
  message: string;
  icon?: string;
}

export function EmptyState({ message, icon = '⚡' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <p className="text-stone-500 text-sm max-w-xs">{message}</p>
    </div>
  );
}
