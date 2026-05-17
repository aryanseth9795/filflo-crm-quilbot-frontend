import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyTickets, useTicketAction } from '@/hooks/useTickets';
import { PriorityBadge, StatusBadge, RequestTypeBadge } from '@/components/tickets/StatusBadge';
import { SkeletonRow, SkeletonStatCard, ButtonSpinner } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import Pagination from '@/components/common/Pagination';
import TimeFrameFilter, { getTimeFrameDates, type TimeFrame } from '@/components/common/TimeFrameFilter';
import CompanyFilter from '@/components/common/CompanyFilter';
import AdminFilter from '@/components/developer/AdminFilter';
import { formatRelative, formatDate } from '@/lib/utils';
import { Play, Ticket, CheckCircle, Clock, GitPullRequest, RotateCcw, Paperclip, Calendar } from 'lucide-react';
import type { Ticket as ITicket, TicketStatus } from '@/types/ticket';

const STATUS_TABS = [
  { value: 'all',         label: 'All Tasks' },
  { value: 'approved',    label: 'Assigned' },
  { value: 'accepted',    label: 'Accepted' },
  { value: 'in_progress', label: 'Active' },
  { value: 'pr_raised',   label: 'PR Raised' },
  { value: 'pr_rejected', label: 'PR Rejected' },
  { value: 'closed',      label: 'Closed' },
];

function StatCard({ icon: Icon, label, value, color, loading }: { icon: React.ElementType; label: string; value: number; color: string; loading: boolean }) {
  if (loading) return <SkeletonStatCard />;
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 flex items-center gap-4 animate-slide-up hover:shadow-[var(--shadow-sm)] transition-shadow">
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

function borderColor(status: TicketStatus): string {
  if (status === 'in_progress') return 'border-l-4 border-l-[var(--color-green)]';
  if (status === 'approved' || status === 'accepted') return 'border-l-4 border-l-[var(--color-blue)]';
  if (status === 'pr_raised') return 'border-l-4 border-l-[#15803d]';
  if (status === 'pr_rejected') return 'border-l-4 border-l-[var(--color-danger)]';
  return '';
}

export default function DeveloperDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [timeframe, setTimeframe] = useState<TimeFrame>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const { acceptTask, startWork } = useTicketAction();

  const { from, to } = useMemo(() => getTimeFrameDates(timeframe, customFrom, customTo), [timeframe, customFrom, customTo]);

  const handleTimeFrameChange = (tf: TimeFrame, cf?: string, ct?: string) => {
    setTimeframe(tf);
    setCustomFrom(cf ?? '');
    setCustomTo(ct ?? '');
    setPage(1);
  };

  const { data, isLoading } = useMyTickets({
    page, limit: 10, from, to,
    ...(activeTab !== 'all' && { status: activeTab as TicketStatus }),
    ...(companyId && { projectId: companyId }),
    ...(approvedBy && { approvedBy }),
  });
  const { data: allData, isLoading: statsLoading } = useMyTickets({
    limit: 1000, from, to,
    ...(companyId && { projectId: companyId }),
    ...(approvedBy && { approvedBy }),
  });

  const allTickets: ITicket[] = allData?.tickets ?? [];
  const activeCount  = allTickets.filter(t => t.status === 'in_progress').length;
  const pendingCount = allTickets.filter(t => ['approved', 'accepted'].includes(t.status)).length;
  const prCount      = allTickets.filter(t => ['pr_raised','pr_review','pr_merged'].includes(t.status)).length;
  const closedCount  = allTickets.filter(t => t.status === 'closed').length;

  const tickets: ITicket[] = data?.tickets ?? [];
  const totalPages: number = data?.totalPages ?? 1;
  const total: number = data?.total ?? 0;

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] mb-1">Developer</p>
        <h1 className="font-serif text-3xl text-[var(--color-ink)]">My Workspace</h1>
        <p className="text-[var(--color-ink-3)] text-sm mt-1">Track and manage your assigned tasks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard loading={statsLoading} icon={Clock}          label="Pending"    value={pendingCount} color="bg-[var(--color-yellow-light)] text-[var(--color-yellow)]" />
        <StatCard loading={statsLoading} icon={Play}           label="Active"     value={activeCount}  color="bg-[var(--color-green-light)] text-[var(--color-green)]" />
        <StatCard loading={statsLoading} icon={GitPullRequest} label="PR Active"  value={prCount}      color="bg-[var(--color-blue-light)] text-[var(--color-blue)]" />
        <StatCard loading={statsLoading} icon={CheckCircle}    label="Closed"     value={closedCount}  color="bg-[var(--color-paper-3)] text-[var(--color-ink-3)]" />
      </div>

      {/* Task list */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg text-[var(--color-ink)]">My Tasks</h2>
              <span className="text-xs font-mono bg-[var(--color-paper-3)] border border-[var(--color-border)] text-[var(--color-ink-3)] px-2 py-0.5 rounded-full">{total}</span>
            </div>
            <TimeFrameFilter value={timeframe} customFrom={customFrom} customTo={customTo} onChange={handleTimeFrameChange} />
            <CompanyFilter value={companyId} onChange={(id) => { setCompanyId(id); setPage(1); }} />
            <AdminFilter value={approvedBy} onChange={(id) => { setApprovedBy(id); setPage(1); }} />
          </div>
          <div className="flex gap-1 flex-wrap">
            {STATUS_TABS.map(({ value, label }) => (
              <button key={value} onClick={() => { setActiveTab(value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wide transition-all ${activeTab === value ? 'bg-[var(--color-ink)] text-white shadow-md' : 'text-[var(--color-ink-3)] hover:bg-[var(--color-paper-2)]'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : !tickets.length ? (
          <EmptyState icon={<Ticket className="w-6 h-6" />} title="No tasks found"
            description={activeTab === 'all' ? 'No tasks assigned to you yet.' : `No ${activeTab.replace(/_/g, ' ')} tasks.`} />
        ) : (
          <>
            <div className="divide-y divide-[var(--color-paper-3)]">
              {tickets.map((ticket, idx) => {
                const project = ticket.projectId as any;
                return (
                  <div key={ticket._id} 
                    onClick={() => navigate(`/developer/tickets/${ticket._id}`)}
                    className={`stagger-item flex items-start gap-4 px-6 py-5 hover:bg-[var(--color-paper-2)] transition-colors cursor-pointer group ${borderColor(ticket.status)}`}
                    style={{ animationDelay: `${idx * 0.04}s` }}>
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Top row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-[var(--color-accent)]">{ticket.ticketNumber}</span>
                        <RequestTypeBadge requestType={ticket.requestType} />
                        {ticket.prRevisionCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-50 text-red-700 px-1.5 py-0.5 rounded">
                            <RotateCcw className="w-2.5 h-2.5" /> Rev #{ticket.prRevisionCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-ink)]">{ticket.description}</p>
                      {/* Meta */}
                      <div className="flex items-center gap-3 text-xs text-[var(--color-ink-4)] flex-wrap">
                        <span>{project?.name ?? '—'}</span>
                        {ticket.requiredDeliveryDays && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {ticket.requiredDeliveryDays}d required
                          </span>
                        )}
                        {ticket.devRolloutTime && (
                          <span className="flex items-center gap-1 text-[var(--color-yellow)]">
                            <Clock className="w-3 h-3" /> Rollout: {formatDate(ticket.devRolloutTime)}
                          </span>
                        )}
                        {ticket.attachments?.length > 0 && (
                          <span className="flex items-center gap-1"><Paperclip className="w-3 h-3" /> {ticket.attachments.length} file{ticket.attachments.length > 1 ? 's' : ''}</span>
                        )}
                        {ticket.adminNotes && (
                          <span className="bg-[var(--color-paper-2)] px-2 py-0.5 rounded text-[var(--color-ink-3)]">📋 {ticket.adminNotes}</span>
                        )}
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                      <span className="text-xs text-[var(--color-ink-4)] min-w-[70px] text-right">{formatRelative(ticket.createdAt)}</span>

                      {/* Accept button */}
                      {ticket.status === 'approved' && (
                        <button onClick={(e) => { e.stopPropagation(); acceptTask.mutate({ id: ticket._id, changeType: 'code' }); }} disabled={acceptTask.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-blue-light)] text-[var(--color-blue)] hover:bg-[var(--color-blue)] hover:text-white transition-all text-xs font-semibold disabled:opacity-50">
                          {acceptTask.isPending ? <ButtonSpinner /> : <Play className="w-3 h-3" />} Accept
                        </button>
                      )}

                      {/* Start Work button */}
                      {ticket.status === 'accepted' && (
                        <button onClick={(e) => { e.stopPropagation(); startWork.mutate(ticket._id); }} disabled={startWork.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-green-light)] text-[var(--color-green)] hover:bg-[var(--color-green)] hover:text-white transition-all text-xs font-semibold disabled:opacity-50">
                          {startWork.isPending ? <ButtonSpinner /> : <Play className="w-3 h-3" />} Start Work
                        </button>
                      )}
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
