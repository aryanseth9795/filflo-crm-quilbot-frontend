import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTickets } from '@/hooks/useTickets';
import { useReportOverview } from '@/hooks/useReports';
import { StatusBadge, PriorityBadge, RequestTypeBadge } from '@/components/tickets/StatusBadge';
import { SkeletonRow, SkeletonStatCard } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import Pagination from '@/components/common/Pagination';
import { formatRelative } from '@/lib/utils';
import TimeFrameFilter, { getTimeFrameDates, type TimeFrame } from '@/components/common/TimeFrameFilter';
import CompanyFilter from '@/components/common/CompanyFilter';
import { Ticket, CheckCircle2, Clock, XCircle, BarChart2, ArrowRight, Inbox, Paperclip } from 'lucide-react';
import type { Ticket as ITicket, TicketStatus } from '@/types/ticket';

const ALL_STATUS_TABS: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all',         label: 'All' },
  { value: 'open',        label: 'Open' },
  { value: 'approved',    label: 'Approved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pr_raised',   label: 'PR Review' },
  { value: 'pr_merged',   label: 'Merged' },
  { value: 'closed',      label: 'Closed' },
  { value: 'rejected',    label: 'Rejected' },
];

function StatCard({ icon: Icon, label, value, color, loading }: { icon: React.ElementType; label: string; value: number; color: string; loading: boolean }) {
  if (loading) return <SkeletonStatCard />;
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow animate-slide-up">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-serif text-[var(--color-ink)]">{value}</p>
        <p className="text-xs text-[var(--color-ink-3)] font-mono uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TicketStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [timeframe, setTimeframe] = useState<TimeFrame>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [companyId, setCompanyId] = useState('');

  const { from, to } = useMemo(() => getTimeFrameDates(timeframe, customFrom, customTo), [timeframe, customFrom, customTo]);

  const handleTimeFrameChange = (tf: TimeFrame, cf?: string, ct?: string) => {
    setTimeframe(tf);
    setCustomFrom(cf ?? '');
    setCustomTo(ct ?? '');
    setPage(1);
  };

  const { data: overview, isLoading: overviewLoading } = useReportOverview();
  const { data, isLoading } = useTickets({
    limit: 10, page, from, to,
    ...(activeTab !== 'all' && { status: activeTab }),
    ...(companyId && { projectId: companyId }),
  } as any);

  const tickets: ITicket[] = data?.tickets ?? [];
  const totalPages: number = data?.totalPages ?? 1;
  const total: number = data?.total ?? 0;
  const unassignedCount = overview?.totalOpen ?? 0;

  const handleTabChange = (tab: TicketStatus | 'all') => { setActiveTab(tab); setPage(1); };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] mb-1">Admin Dashboard</p>
          <h1 className="font-serif text-3xl text-[var(--color-ink)]">Command Centre</h1>
          <p className="text-[var(--color-ink-3)] text-sm mt-1">System-wide overview of all tickets and activity</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/projects"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-ink-2)] hover:bg-[var(--color-paper-2)] transition-all">
            Manage Projects
          </Link>
          <Link to="/admin/reports"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium hover:bg-[var(--color-ink-2)] transition-all">
            <BarChart2 className="w-4 h-4" /> Reports
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard loading={overviewLoading} icon={Ticket}          label="Open"        value={overview?.totalOpen ?? 0}        color="bg-[var(--color-blue-light)] text-[var(--color-blue)]" />
        <StatCard loading={overviewLoading} icon={Clock}           label="In Progress"  value={overview?.totalInProgress ?? 0}   color="bg-[var(--color-yellow-light)] text-[var(--color-yellow)]" />
        <StatCard loading={overviewLoading} icon={CheckCircle2}    label="Closed"       value={overview?.totalClosed ?? 0}       color="bg-[var(--color-green-light)] text-[var(--color-green)]" />
        <StatCard loading={overviewLoading} icon={XCircle}         label="Rejected"     value={overview?.totalRejected ?? 0}     color="bg-[var(--color-danger-light)] text-[var(--color-danger)]" />
      </div>

      {/* Queue CTA */}
      {unassignedCount > 0 && (
        <Link to="/admin/tickets"
          className="flex items-center justify-between px-6 py-4 rounded-xl bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-2)] transition-all group animate-slide-up">
          <div className="flex items-center gap-3">
            <Inbox className="w-5 h-5 opacity-70" />
            <div>
              <p className="text-sm font-semibold">{unassignedCount} open ticket{unassignedCount !== 1 ? 's' : ''} awaiting action</p>
              <p className="text-xs text-white/60 mt-0.5">Go to Ticket Queue to review and assign developers</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* Recent Activity */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg text-[var(--color-ink)]">All Tickets</h2>
              <span className="text-xs font-mono bg-[var(--color-paper-3)] border border-[var(--color-border)] text-[var(--color-ink-3)] px-2 py-0.5 rounded-full">{total}</span>
            </div>
            <TimeFrameFilter value={timeframe} customFrom={customFrom} customTo={customTo} onChange={handleTimeFrameChange} />
            <CompanyFilter value={companyId} onChange={(id) => { setCompanyId(id); setPage(1); }} />
          </div>
          <div className="flex gap-1 flex-wrap">
            {ALL_STATUS_TABS.map(({ value, label }) => (
              <button key={value} onClick={() => handleTabChange(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wide transition-all ${activeTab === value ? 'bg-[var(--color-ink)] text-white shadow-md' : 'text-[var(--color-ink-3)] hover:bg-[var(--color-paper-2)]'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div>{[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : !tickets.length ? (
          <EmptyState icon={<Ticket className="w-6 h-6" />} title="No tickets found" description="No tickets match the selected filter." />
        ) : (
          <>
            <div className="divide-y divide-[var(--color-paper-3)]">
              {tickets.map((ticket, idx) => {
                const project = ticket.projectId as any;
                return (
                  <div key={ticket._id} onClick={() => navigate(`/admin/tickets/${ticket._id}`)}
                    className="stagger-item flex items-center gap-4 px-6 py-4 hover:bg-[var(--color-paper-2)] transition-colors cursor-pointer group"
                    style={{ animationDelay: `${idx * 0.03}s` }}>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[var(--color-accent)]">{ticket.ticketNumber}</span>
                        <RequestTypeBadge requestType={ticket.requestType} />
                      </div>
                      <p className="text-sm text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors truncate">{ticket.description}</p>
                      <p className="text-xs text-[var(--color-ink-4)]">
                        {project?.name ?? '—'}
                        {ticket.assignedTo && typeof ticket.assignedTo === 'object' && (
                          <> · <span className="text-[var(--color-ink-3)]">Dev: {(ticket.assignedTo as any).name}</span></>
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
                      <span className="text-xs text-[var(--color-ink-4)] min-w-[65px] text-right">{formatRelative(ticket.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} limit={10} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
