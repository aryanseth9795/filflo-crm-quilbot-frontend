import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Ticket, Clock, CheckCircle2, GitPullRequest, MessageSquare, X } from 'lucide-react';
import { useMyTickets, useTicketAction } from '@/hooks/useTickets';
import { useAuthStore } from '@/stores/auth.store';
import { StatusBadge, PriorityBadge, RequestTypeBadge } from '@/components/tickets/StatusBadge';
import { SkeletonRow, SkeletonStatCard, ButtonSpinner } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import Pagination from '@/components/common/Pagination';
import TimeFrameFilter, { getTimeFrameDates, type TimeFrame } from '@/components/common/TimeFrameFilter';
import CompanyFilter from '@/components/common/CompanyFilter';
import { formatRelative } from '@/lib/utils';
import type { Ticket as ITicket, TicketStatus } from '@/types/ticket';

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'all',         label: 'All' },
  { value: 'open',        label: 'Open' },
  { value: 'approved',    label: 'Approved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pr_raised',   label: 'PR Raised' },
  { value: 'pr_merged',   label: 'PR Merged' },
  { value: 'closed',      label: 'Closed' },
  { value: 'rejected',    label: 'Rejected' },
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

function FeedbackModal({ ticket, onClose }: { ticket: ITicket; onClose: () => void }) {
  const [feedback, setFeedback] = useState(ticket.clientFeedback ?? '');
  const [remark, setRemark] = useState(ticket.supportRemark ?? '');
  const { addFeedback, close } = useTicketAction();

  const handleSaveFeedback = () => {
    addFeedback.mutate({ id: ticket._id, clientFeedback: feedback, supportRemark: remark });
  };

  const handleClose = () => {
    close.mutate(ticket._id, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-[var(--shadow-lg)] w-full max-w-lg animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
          <div>
            <p className="text-xs font-mono text-[var(--color-ink-3)] uppercase tracking-wide">{ticket.ticketNumber}</p>
            <h3 className="font-serif text-lg text-[var(--color-ink)]">Feedback & Remark</h3>
          </div>
          <button onClick={onClose} className="text-[var(--color-ink-4)] hover:text-[var(--color-ink)] transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">Client Feedback (optional)</label>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
              placeholder="What did the client say about the resolution?"
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] text-sm focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)] resize-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">Developer Remark (appreciation)</label>
            <textarea value={remark} onChange={e => setRemark(e.target.value)} rows={2}
              placeholder="Great work! Quick turnaround on this one..."
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] text-sm focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)] resize-none transition-all" />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={handleSaveFeedback} disabled={addFeedback.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] disabled:opacity-60 transition-all">
            {addFeedback.isPending ? <ButtonSpinner /> : <MessageSquare className="w-4 h-4" />} Save Feedback
          </button>
          <button onClick={handleClose} disabled={close.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-green)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-all">
            {close.isPending ? <ButtonSpinner /> : <CheckCircle2 className="w-4 h-4" />} Close Ticket
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SupportDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [timeframe, setTimeframe] = useState<TimeFrame>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [feedbackTicket, setFeedbackTicket] = useState<ITicket | null>(null);

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
  });
  const { data: allData, isLoading: statsLoading } = useMyTickets({
    limit: 1000, from, to,
    ...(companyId && { projectId: companyId }),
  });

  const tickets: ITicket[] = data?.tickets ?? [];
  const allTickets: ITicket[] = allData?.tickets ?? [];
  const totalPages: number = data?.totalPages ?? 1;
  const total: number = data?.total ?? 0;

  const open       = allTickets.filter(t => t.status === 'open').length;
  const inProgress = allTickets.filter(t => ['accepted','in_progress'].includes(t.status)).length;
  const prActive   = allTickets.filter(t => ['pr_raised','pr_review','pr_merged'].includes(t.status)).length;
  const closed     = allTickets.filter(t => t.status === 'closed').length;

  const handleTabChange = (tab: string) => { setActiveTab(tab); setPage(1); };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] mb-1">Support Dashboard</p>
          <h1 className="font-serif text-3xl text-[var(--color-ink)]">Hello, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-[var(--color-ink-3)] text-sm mt-1">Here's a summary of your tickets</p>
        </div>
        <Link to="/support/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium hover:bg-[var(--color-ink-2)] transition-all hover:shadow-md active:scale-[0.99]">
          <Plus className="w-4 h-4" /> Raise Ticket
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard loading={statsLoading} icon={Ticket}         label="Open"        value={open}       color="bg-[var(--color-blue-light)] text-[var(--color-blue)]" />
        <StatCard loading={statsLoading} icon={Clock}          label="In Progress"  value={inProgress}  color="bg-[var(--color-yellow-light)] text-[var(--color-yellow)]" />
        <StatCard loading={statsLoading} icon={GitPullRequest} label="PR Active"    value={prActive}    color="bg-[var(--color-green-light)] text-[var(--color-green)]" />
        <StatCard loading={statsLoading} icon={CheckCircle2}   label="Closed"       value={closed}      color="bg-[var(--color-purple-light)] text-[var(--color-purple)]" />
      </div>

      {/* Ticket list */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg text-[var(--color-ink)]">My Tickets</h2>
                <span className="text-xs font-mono bg-[var(--color-paper-3)] border border-[var(--color-border)] text-[var(--color-ink-3)] px-2 py-0.5 rounded-full">{total}</span>
              </div>
              <TimeFrameFilter value={timeframe} customFrom={customFrom} customTo={customTo} onChange={handleTimeFrameChange} />
              <CompanyFilter value={companyId} onChange={(id) => { setCompanyId(id); setPage(1); }} />
            </div>
          <div className="flex gap-1 flex-wrap">
            {STATUS_TABS.map(({ value, label }) => (
              <button key={value} onClick={() => handleTabChange(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wide transition-all ${activeTab === value ? 'bg-[var(--color-ink)] text-white shadow-md' : 'text-[var(--color-ink-3)] hover:bg-[var(--color-paper-2)]'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : !tickets.length ? (
          <EmptyState icon={<Ticket className="w-6 h-6" />} title="No tickets found"
            description={activeTab === 'all' ? 'Raise your first ticket to get started.' : `No ${activeTab.replace(/_/g, ' ')} tickets.`}
            action={activeTab === 'all' ? <Link to="/support/new" className="px-4 py-2 rounded-lg bg-[var(--color-ink)] text-white text-sm">Raise Ticket</Link> : undefined} />
        ) : (
          <>
            <div className="divide-y divide-[var(--color-paper-3)]">
              {tickets.map((ticket, idx) => {
                const project = ticket.projectId as any;
                const canFeedback = ['pr_merged'].includes(ticket.status);
                return (
                  <div key={ticket._id}
                    onClick={() => navigate(`/support/ticket/${ticket._id}`)}
                    className="stagger-item flex items-center gap-4 px-6 py-4 hover:bg-[var(--color-paper-2)] transition-colors cursor-pointer group"
                    style={{ animationDelay: `${idx * 0.04}s` }}>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[var(--color-accent)]">{ticket.ticketNumber}</span>
                        <RequestTypeBadge requestType={ticket.requestType} />
                      </div>
                      <p className="text-sm text-[var(--color-ink)] truncate">{ticket.description}</p>
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
                        <span className="text-xs text-[var(--color-ink-4)] flex items-center gap-1">
                          📎 {ticket.attachments.length}
                        </span>
                      )}
                      <span className="text-xs text-[var(--color-ink-4)] min-w-[70px] text-right">{formatRelative(ticket.createdAt)}</span>
                      {canFeedback && (
                        <button onClick={(e) => { e.stopPropagation(); setFeedbackTicket(ticket); }}
                          className="ml-1 px-2.5 py-1.5 rounded-lg bg-[var(--color-green-light)] text-[var(--color-green)] text-xs font-medium hover:opacity-80 transition-opacity flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Feedback &amp; Close
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

      {feedbackTicket && <FeedbackModal ticket={feedbackTicket} onClose={() => setFeedbackTicket(null)} />}
    </div>
  );
}
