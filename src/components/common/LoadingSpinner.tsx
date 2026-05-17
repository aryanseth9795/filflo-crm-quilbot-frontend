import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export default function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-[var(--color-accent)]', sizes[size])} />
      {label && <p className="text-sm text-[var(--color-ink-3)]">{label}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <LoadingSpinner size="lg" label="Loading..." />
    </div>
  );
}

/** Inline button spinner */
export function ButtonSpinner() {
  return <Loader2 className="w-4 h-4 animate-spin" />;
}

/** Single skeleton bar */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

/** Skeleton card row — for ticket lists */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-5 border-b border-[var(--color-paper-3)]">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

/** Skeleton for stat cards */
export function SkeletonStatCard() {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 flex items-center gap-4">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-10" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

