import { useHappinessIndex } from '@/hooks/useReports';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { Smile, Meh, Frown } from 'lucide-react';
import { formatRelative } from '@/lib/utils';

export default function HappinessIndex() {
  const { data: companies, isLoading } = useHappinessIndex();

  if (isLoading) return <PageLoader />;

  const getMood = (avgHrs: number | null) => {
    if (avgHrs === null) return { icon: Smile, color: 'text-[var(--color-ink-4)]', bg: 'bg-[var(--color-paper-2)]' };
    if (avgHrs <= 24) return { icon: Smile, color: 'text-[var(--color-green)]', bg: 'bg-[var(--color-green-light)]' };
    if (avgHrs <= 72) return { icon: Meh, color: 'text-[var(--color-yellow)]', bg: 'bg-[var(--color-yellow-light)]' };
    return { icon: Frown, color: 'text-[var(--color-danger)]', bg: 'bg-[var(--color-danger-light)]' };
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-[var(--color-ink)]">Customer Happiness Index</h1>
        <p className="text-[var(--color-ink-3)] text-sm mt-1">Gauge client satisfaction based on resolution times</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies?.map((company: any) => {
          const mood = getMood(company.avgResolutionHrs);
          const Icon = mood.icon;
          return (
            <div key={company.companyName} className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-[var(--shadow-sm)] flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${mood.bg} ${mood.color}`}>
                <Icon className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-xl text-[var(--color-ink)] mb-1">{company.companyName}</h2>
              <p className="text-sm text-[var(--color-ink-3)] mb-6">
                Avg Resolution: <span className="font-semibold text-[var(--color-ink)]">{company.avgResolutionHrs ?? '—'} hrs</span>
              </p>
              
              <div className="w-full grid grid-cols-3 gap-2 border-t border-[var(--color-border)] pt-4">
                <div>
                  <p className="text-lg font-semibold text-[var(--color-ink)]">{company.totalQueries}</p>
                  <p className="text-xs font-mono text-[var(--color-ink-4)] uppercase">Total</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-[var(--color-green)]">{company.resolvedQueries}</p>
                  <p className="text-xs font-mono text-[var(--color-ink-4)] uppercase">Resolved</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-[var(--color-blue)]">{company.openTickets}</p>
                  <p className="text-xs font-mono text-[var(--color-ink-4)] uppercase">Active</p>
                </div>
              </div>
              
              {company.lastQueryDate && (
                <p className="text-xs text-[var(--color-ink-4)] mt-4">Last active {formatRelative(company.lastQueryDate)}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
