import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '@/hooks/useTickets';
import { StatusBadge, PriorityBadge, RequestTypeBadge } from '@/components/tickets/StatusBadge';
import { SkeletonRow } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import Pagination from '@/components/common/Pagination';
import { formatRelative } from '@/lib/utils';
import TimeFrameFilter, { getTimeFrameDates, type TimeFrame } from '@/components/common/TimeFrameFilter';
import { Ticket, InboxIcon, AlertCircle, Paperclip, GitPullRequest } from 'lucide-react';
import type { Ticket as ITicket, TicketStatus, TicketRequestType } from '@/types/ticket';
import { REQUEST_TYPE_LABELS } from '@/types/ticket';

const STATUS_TABS: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all',        label: 'All' },
  { value: 'open',       label: 'Open' },
  { value: 'approved',   label: 'Approved' },
  { value: 'pr_raised',  label: 'PR Review' },
  { value: 'pr_merged',  label: 'PR Merged' },
  { value: 'rejected',   label: 'Rejected' },
];

const REQUEST_TYPE_FILTERS: { value: TicketRequestType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  ...Object.entries(REQUEST_TYPE_LABELS).map(([k, v]) => ({ value: k as TicketRequestType, label: v })),
];

const PRIORITY_COLORS: Record<string, string> = {
  P0: 'bg-[var(--color-danger)]',
  P1: 'bg-[var(--color-yellow)]',
  P2: 'bg-[var(--color-blue)]',
  P3: 'bg-[var(--color-border)]',
};

export default function TicketQueue() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TicketStatus | 'all'>('all');
  const [requestTypeFilter, setRequestTypeFilter] = useState<TicketRequestType | 'all'>('all');
  const [page, setPage] = useState(1);
  const [timeframe, setTimeframe] = useState<TimeFrame>('7d');

  const { from, to } = useMemo(() => getTimeFrameDates(timeframe), [timeframe]);

  const { data, isLoading } = useTickets({
    limit: 20, page,
    from, to,
    ...(activeTab !== 'all' && { status: activeTab }),
    ...(requestTypeFilter !== 'all' && { requestType: requestTypeFilter }),
  });

  const tickets: ITicket[] = data?.tickets ?? [];
  const totalPages: number = data?.totalPages ?? 1;
  const total: number = data?.total ?? 0;
  const openCount = data?.tickets?.filter((t: ITicket) => t.status === 'open').length ?? 0;
  const prPendingCount = data?.tickets?.filter((t: ITicket) => t.status === 'pr_raised').length ?? 0;

  const handleTabChange = (tab: TicketStatus | 'all') => { setActiveTab(tab); setPage(1); };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] mb-1">Admin</p>
        <h1 className="font-serif text-3xl text-[var(--color-ink)]">Ticket Queue</h1>
        <p className="text-[var(--color-ink-3)] text-sm mt-1">All tickets — review, assign, and manage PR lifecycle</p>
      </div>

      {/* Alert banners */}
      <div className="space-y-2">
        {openCount > 0 && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-[var(--color-yellow-light)] border border-[var(--color-yellow)] animate-slide-up">
            <AlertCircle className="w-4 h-4 text-[var(--color-yellow)] flex-shrink-0" />
            <p className="text-sm text-[var(--color-ink-2)]">
              <span className="font-semibold">{openCount} open ticket{openCount !== 1 ? 's' : ''}</span> on this page waiting for assignment.
            </p>
          </div>
        )}
        {prPendingCount > 0 && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-[#f0fdf4] border border-[#86efac] animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <GitPullRequest className="w-4 h-4 text-[#15803d] flex-shrink-0" />
            <p className="text-sm text-[var(--color-ink-2)]">
              <span className="font-semibold">{prPendingCount} PR{prPendingCount !== 1 ? 's' : ''}</span> waiting for your review.
            </p>
          </div>
        )}
      </div>

      {/* Queue card */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)] space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <InboxIcon className="w-4 h-4 text-[var(--color-ink-3)]" />
                <h2 className="font-serif text-lg text-[var(--color-ink)]">All Tickets</h2>
                <span className="text-xs font-mono bg-[var(--color-paper-3)] border border-[var(--color-border)] text-[var(--color-ink-3)] px-2 py-0.5 rounded-full">{total}</span>
              </div>
              <TimeFrameFilter value={timeframe} onChange={(tf) => { setTimeframe(tf); setPage(1); }} />
            </div>
            {/* Status filter */}
            <div className="flex gap-1 flex-wrap">
              {STATUS_TABS.map(({ value, label }) => (
                <button key={value} onClick={() => handleTabChange(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wide transition-all ${activeTab === value ? 'bg-[var(--color-ink)] text-white shadow-md' : 'text-[var(--color-ink-3)] hover:bg-[var(--color-paper-2)]'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Request type filter */}
          <div className="flex gap-1 flex-wrap">
            {REQUEST_TYPE_FILTERS.map(({ value, label }) => (
              <button key={value} onClick={() => { setRequestTypeFilter(value); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wide transition-all ${requestTypeFilter === value ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border border-[var(--color-accent)]' : 'text-[var(--color-ink-4)] hover:bg-[var(--color-paper-2)] border border-transparent'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div>{[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : !tickets.length ? (
          <EmptyState icon={<Ticket className="w-6 h-6" />} title="Queue is clear" description="No tickets match the current filters." />
        ) : (
          <>
            <div className="divide-y divide-[var(--color-paper-3)]">
              {tickets.map((ticket, idx) => {
                const project = ticket.projectId as any;
                return (
                  <div key={ticket._id} onClick={() => navigate(`/admin/tickets/${ticket._id}`)}
                    className="stagger-item flex items-center gap-4 px-6 py-4 hover:bg-[var(--color-paper-2)] transition-colors cursor-pointer group"
                    style={{ animationDelay: `${idx * 0.03}s` }}>
                    {/* Priority bar */}
                    <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${PRIORITY_COLORS[ticket.priority] ?? 'bg-[var(--color-border)]'}`} />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-[var(--color-accent)]">{ticket.ticketNumber}</span>
                        <RequestTypeBadge requestType={ticket.requestType} />
                      </div>
                      <p className="text-sm text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors truncate">{ticket.description}</p>
                      <p className="text-xs text-[var(--color-ink-4)]">
                        {project?.name ?? '—'}
                        {ticket.assignedTo && typeof ticket.assignedTo === 'object' && (
                          <> · Dev: <span className="text-[var(--color-ink-3)]">{(ticket.assignedTo as any).name}</span></>
                        )}
                        {ticket.requiredDeliveryDays && (
                          <> · <span className="text-[var(--color-yellow)]">{ticket.requiredDeliveryDays}d required</span></>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                      {ticket.attachments?.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-[var(--color-ink-4)]">
                          <Paperclip className="w-3 h-3" />{ticket.attachments.length}
                        </span>
                      )}
                      <span className="text-xs text-[var(--color-ink-4)] min-w-[60px] text-right">{formatRelative(ticket.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={20} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
