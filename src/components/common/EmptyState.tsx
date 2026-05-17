import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="w-14 h-14 rounded-2xl bg-[var(--color-paper-2)] border border-[var(--color-border)] flex items-center justify-center mb-4 text-[var(--color-ink-4)]">
        {icon ?? <AlertCircle className="w-7 h-7" />}
      </div>
      <h3 className="font-serif text-xl text-[var(--color-ink)] mb-2">{title}</h3>
      {description && <p className="text-sm text-[var(--color-ink-3)] max-w-xs mb-6">{description}</p>}
      {action}
    </div>
  );
}
