import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export type TimeFrame = 'today' | 'yesterday' | '7d' | 'this_month' | '3m' | '6m' | 'custom';

const TIMEFRAMES: { value: TimeFrame; label: string }[] = [
  { value: 'today',      label: 'Today' },
  { value: 'yesterday',  label: 'Yesterday' },
  { value: '7d',         label: 'Last 7 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: '3m',         label: 'Last 3 Months' },
  { value: '6m',         label: 'Last 6 Months' },
  { value: 'custom',     label: 'Custom Range' },
];

export function getTimeFrameDates(
  timeframe: TimeFrame,
  customFrom?: string,
  customTo?: string
): { from: string; to: string } {
  const now = new Date();

  if (timeframe === 'custom') {
    return {
      from: customFrom ? new Date(customFrom).toISOString() : '',
      to: customTo ? new Date(customTo + 'T23:59:59').toISOString() : now.toISOString(),
    };
  }

  const to = now.toISOString();
  let fromDate = new Date();

  switch (timeframe) {
    case 'today':
      fromDate.setHours(0, 0, 0, 0);
      break;
    case 'yesterday': {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      yest.setHours(0, 0, 0, 0);
      const yestEnd = new Date(yest);
      yestEnd.setHours(23, 59, 59, 999);
      return { from: yest.toISOString(), to: yestEnd.toISOString() };
    }
    case '7d':
      fromDate.setDate(now.getDate() - 7);
      break;
    case 'this_month':
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case '3m':
      fromDate.setMonth(now.getMonth() - 3);
      break;
    case '6m':
      fromDate.setMonth(now.getMonth() - 6);
      break;
  }

  return { from: fromDate.toISOString(), to };
}

interface TimeFrameFilterProps {
  value: TimeFrame;
  customFrom?: string;
  customTo?: string;
  onChange: (value: TimeFrame, customFrom?: string, customTo?: string) => void;
}

export default function TimeFrameFilter({ value, customFrom = '', customTo = '', onChange }: TimeFrameFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFrom, setLocalFrom] = useState(customFrom);
  const [localTo, setLocalTo] = useState(customTo);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const activeLabel = TIMEFRAMES.find((t) => t.value === value)?.label || 'Timeframe';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-white text-xs font-medium text-[var(--color-ink-2)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all"
      >
        <Calendar className="w-3.5 h-3.5" />
        {activeLabel}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-md)] overflow-hidden z-20 animate-slide-up origin-top-right">
          {TIMEFRAMES.filter(tf => tf.value !== 'custom').map((tf) => (
            <button
              key={tf.value}
              onClick={() => { onChange(tf.value); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${
                value === tf.value && value !== 'custom'
                  ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                  : 'text-[var(--color-ink-2)] hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)]'
              }`}
            >
              {tf.label}
            </button>
          ))}

          {/* Custom range */}
          <div className="border-t border-[var(--color-border)] px-4 py-3 space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)]">Custom Range</p>
            <div className="flex flex-col gap-1.5">
              <input
                type="date"
                value={localFrom}
                onChange={(e) => setLocalFrom(e.target.value)}
                className="w-full text-xs px-2 py-1 border border-[var(--color-border)] rounded-md bg-[var(--color-paper)] focus:outline-none focus:border-[var(--color-accent)]"
              />
              <input
                type="date"
                value={localTo}
                onChange={(e) => setLocalTo(e.target.value)}
                className="w-full text-xs px-2 py-1 border border-[var(--color-border)] rounded-md bg-[var(--color-paper)] focus:outline-none focus:border-[var(--color-accent)]"
              />
              <button
                onClick={() => { onChange('custom', localFrom, localTo); setIsOpen(false); }}
                disabled={!localFrom || !localTo}
                className="w-full text-xs py-1.5 rounded-md bg-[var(--color-ink)] text-white font-medium hover:bg-[var(--color-ink-2)] disabled:opacity-40 transition-all"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
