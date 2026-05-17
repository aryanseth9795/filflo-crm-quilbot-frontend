import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useTicket, useTicketAction, useTicketTimeline } from '@/hooks/useTickets';
import { useDevelopers } from '@/hooks/useDevelopers';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge, PriorityBadge, RequestTypeBadge } from '@/components/tickets/StatusBadge';
import { PageLoader, ButtonSpinner } from '@/components/common/LoadingSpinner';
import { formatDate, formatRelative, formatBytes } from '@/lib/utils';
import {
  ArrowLeft, User, Calendar, Clock, GitPullRequest, Paperclip,
  CheckCircle2, XCircle, UserCheck, GitMerge, GitPullRequestClosed,
  Play, MessageSquare, RotateCcw, ExternalLink, X, FileText, Star,
  Building2, Timer, Link2, Database,
} from 'lucide-react';
import type { Attachment } from '@/types/ticket';
import { REQUEST_TYPE_LABELS, STATUS_LABELS } from '@/types/ticket';

// ── Sub-components ──────────────────────────────────────────────────────────

function Field({ label, value, icon: Icon, className = '' }: {
  label: string; value?: string | number | null;
  icon?: React.ElementType; className?: string;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className={`space-y-0.5 ${className}`}>
      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)] flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}{label}
      </p>
      <p className="text-sm text-[var(--color-ink-2)] font-medium">{value}</p>
    </div>
  );
}

function InfoBox({ color, label, children }: { color: string; label: string; children: React.ReactNode }) {
  return (
    <div className={`px-4 py-3 rounded-xl border-l-4 ${color} animate-slide-up`}>
      <p className="text-[10px] font-mono uppercase tracking-widest mb-1 opacity-70">{label}</p>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function AttachmentGallery({ attachments }: { attachments: Attachment[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (!attachments.length) return null;
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-3 flex items-center gap-1.5">
        <Paperclip className="w-3 h-3" /> Attachments ({attachments.length}) — {formatBytes(attachments.reduce((s, a) => s + a.sizeBytes, 0))}
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {attachments.map((att, i) => {
          const isImg = att.mimeType.startsWith('image/');
          return (
            <div key={i} onClick={() => isImg ? setLightbox(att.secureUrl) : window.open(att.secureUrl, '_blank')}
              className="group relative rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-paper-2)] aspect-square flex items-center justify-center cursor-pointer hover:border-[var(--color-accent)] transition-all">
              {isImg
                ? <img src={att.secureUrl} alt={att.fileName} className="w-full h-full object-cover" />
                : <div className="flex flex-col items-center gap-1 p-2 text-center">
                    <FileText className="w-6 h-6 text-[var(--color-ink-3)]" />
                    <span className="text-[9px] text-[var(--color-ink-4)] truncate w-full">{att.fileName}</span>
                  </div>}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ExternalLink className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="absolute bottom-1 right-1 text-[8px] bg-black/60 text-white px-1 rounded">{formatBytes(att.sizeBytes)}</span>
            </div>
          );
        })}
      </div>
      {lightbox && createPortal(
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"><X className="w-8 h-8" /></button>
          <img src={lightbox} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()} />
        </div>,
        document.body
      )}
    </div>
  );
}

const EVENT_LABELS: Record<string, string> = {
  created: 'Ticket Raised', approved: 'Approved & Assigned', rejected: 'Rejected',
  accepted: 'Task Accepted', work_started: 'Work Started', rollout_set: 'Rollout Time Set',
  pr_raised: 'PR Raised', pr_merged: 'PR Merged', pr_rejected: 'PR Rejected',
  pr_reopened: 'PR Reopened', db_change_completed: 'DB Change Completed',
  feedback_added: 'Feedback Added', closed: 'Closed',
};

function DynamicTimeline({ ticketId }: { ticketId: string }) {
  const { data: events, isLoading } = useTicketTimeline(ticketId);

  if (isLoading) return <div className="animate-pulse h-10 bg-[var(--color-paper-3)] rounded" />;
  if (!events?.length) return <p className="text-xs text-[var(--color-ink-4)] italic">No lifecycle events yet.</p>;

  return (
    <div className="relative">
      <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-[var(--color-border)]" />
      <div className="space-y-4">
        {events.map((ev: any, i: number) => (
          <div key={i} className="flex items-start gap-4 relative">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold z-10 ${
              ev.event === 'closed' ? 'bg-[var(--color-green)]' :
              ev.event.includes('rejected') ? 'bg-[var(--color-danger)]' :
              ev.event.includes('pr_') || ev.event === 'db_change_completed' ? 'bg-[var(--color-blue)]' :
              'bg-[var(--color-accent)]'
            }`}>{i + 1}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-ink)]">{EVENT_LABELS[ev.event] ?? ev.event}</p>
              {ev.performedByName && <p className="text-xs text-[var(--color-ink-3)] mt-0.5">by {ev.performedByName}</p>}
              {ev.metadata?.changeType && <p className="text-xs text-[var(--color-ink-4)]">Type: {ev.metadata.changeType === 'db_direct' ? 'DB Change' : 'Code Change'}</p>}
              {ev.metadata?.prUrl && <a href={ev.metadata.prUrl as string} target="_blank" rel="noreferrer" className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1 mt-0.5"><ExternalLink className="w-3 h-3" /> View PR</a>}
              <p className="text-[10px] text-[var(--color-ink-4)] mt-0.5">{formatRelative(ev.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Action Panels ────────────────────────────────────────────────────────────

function AdminActions({ ticket, developers }: { ticket: any; developers: any[] }) {
  const { approve, reject, reviewPR } = useTicketAction();
  const [mode, setMode] = useState<'view' | 'approve' | 'reject' | 'pr-reject'>('view');
  const [selectedDev, setSelectedDev] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [prNotes, setPrNotes] = useState('');
  const mainDev = ticket.projectId?.mainDeveloper;

  if (['closed', 'rejected'].includes(ticket.status)) return null;

  return (
    <div className="px-6 py-5 border-t border-[var(--color-border)] bg-[var(--color-paper-2)] space-y-3">
      <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-3)]">Admin Actions</p>

      {/* PR Review */}
      {ticket.status === 'pr_raised' && mode === 'view' && (
        <div className="flex gap-2">
          <button onClick={() => reviewPR.mutate({ id: ticket._id, action: 'merge' })} disabled={reviewPR.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#166534] text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-all">
            {reviewPR.isPending ? <ButtonSpinner /> : <GitMerge className="w-4 h-4" />} Merge PR
          </button>
          <button onClick={() => setMode('pr-reject')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-danger)] text-white text-sm font-medium hover:opacity-90 transition-all">
            <GitPullRequestClosed className="w-4 h-4" /> Reject PR
          </button>
        </div>
      )}
      {mode === 'pr-reject' && (
        <div className="space-y-2 animate-slide-up">
          <textarea value={prNotes} onChange={e => setPrNotes(e.target.value)} rows={2} placeholder="Reason for rejecting PR..."
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:border-[var(--color-danger)] resize-none" />
          <div className="flex gap-2">
            <button onClick={() => reviewPR.mutate({ id: ticket._id, action: 'reject', notes: prNotes }, { onSuccess: () => setMode('view') })}
              disabled={reviewPR.isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-danger)] text-white text-sm disabled:opacity-60">
              {reviewPR.isPending ? <ButtonSpinner /> : null} Confirm Reject
            </button>
            <button onClick={() => setMode('view')} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Approve / Reject */}
      {ticket.status === 'open' && mode === 'view' && (
        <div className="flex gap-2">
          <button onClick={() => setMode('approve')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-green)] text-white text-sm hover:opacity-90 transition-all">
            <CheckCircle2 className="w-4 h-4" /> Approve & Assign
          </button>
          <button onClick={() => setMode('reject')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-danger)] text-white text-sm hover:opacity-90 transition-all">
            <XCircle className="w-4 h-4" /> Reject
          </button>
        </div>
      )}
      {mode === 'approve' && (
        <div className="space-y-2 animate-slide-up">
          <select value={selectedDev} onChange={e => setSelectedDev(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:border-[var(--color-accent)]">
            <option value="">Select developer</option>
            {mainDev && <option value={mainDev._id}>⭐ {mainDev.name} (Main Dev)</option>}
            {developers?.filter((d: any) => d._id !== mainDev?._id).map((d: any) =>
              <option key={d._id} value={d._id}>{d.name} (Load: {d.profile?.currentLoad ?? 0})</option>)}
          </select>
          <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} placeholder="Notes for developer (optional)..."
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none resize-none" />
          <div className="flex gap-2">
            <button onClick={() => approve.mutate({ id: ticket._id, assignedTo: selectedDev, adminNotes }, { onSuccess: () => setMode('view') })}
              disabled={!selectedDev || approve.isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-green)] text-white text-sm disabled:opacity-60">
              {approve.isPending ? <ButtonSpinner /> : <UserCheck className="w-4 h-4" />} Approve
            </button>
            <button onClick={() => setMode('view')} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
          </div>
        </div>
      )}
      {mode === 'reject' && (
        <div className="space-y-2 animate-slide-up">
          <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={2} placeholder="Reason for rejection..."
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none resize-none" />
          <div className="flex gap-2">
            <button onClick={() => reject.mutate({ id: ticket._id, rejectionReason }, { onSuccess: () => setMode('view') })}
              disabled={!rejectionReason || reject.isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-danger)] text-white text-sm disabled:opacity-60">
              {reject.isPending ? <ButtonSpinner /> : <XCircle className="w-4 h-4" />} Reject Ticket
            </button>
            <button onClick={() => setMode('view')} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DeveloperActions({ ticket }: { ticket: any }) {
  const { acceptTask, startWork, completeDbChange } = useTicketAction();
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  if (!['approved', 'accepted', 'in_progress'].includes(ticket.status)) return null;

  return (
    <div className="px-6 py-5 border-t border-[var(--color-border)] bg-[var(--color-paper-2)] space-y-3">
      <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-3)]">Your Actions</p>

      {/* Accept task — shows modal to pick code vs db change */}
      {ticket.status === 'approved' && !showAcceptModal && (
        <button onClick={() => setShowAcceptModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-blue)] text-white text-sm hover:opacity-90 disabled:opacity-60 transition-all">
          <Play className="w-4 h-4" /> Accept Task
        </button>
      )}

      {ticket.status === 'approved' && showAcceptModal && (
        <div className="animate-slide-up space-y-3 bg-white border border-[var(--color-border)] rounded-xl p-4">
          <p className="text-sm font-medium text-[var(--color-ink)]">What type of change is this?</p>
          <div className="flex gap-3">
            <button onClick={() => acceptTask.mutate({ id: ticket._id, changeType: 'code' }, { onSuccess: () => setShowAcceptModal(false) })}
              disabled={acceptTask.isPending}
              className="flex-1 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 border-[var(--color-blue)] bg-[var(--color-blue-light)] text-[var(--color-blue)] text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-all">
              {acceptTask.isPending ? <ButtonSpinner /> : <GitPullRequest className="w-5 h-5" />}
              <span>Code Change</span>
              <span className="text-[10px] opacity-70">Will go through PR workflow</span>
            </button>
            <button onClick={() => acceptTask.mutate({ id: ticket._id, changeType: 'db_direct' }, { onSuccess: () => setShowAcceptModal(false) })}
              disabled={acceptTask.isPending}
              className="flex-1 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 border-[var(--color-yellow)] bg-[var(--color-yellow-light)] text-[var(--color-ink)] text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-all">
              {acceptTask.isPending ? <ButtonSpinner /> : <Database className="w-5 h-5" />}
              <span>DB Change</span>
              <span className="text-[10px] opacity-70">Direct DB — mark done manually</span>
            </button>
          </div>
          <button onClick={() => setShowAcceptModal(false)} className="text-xs text-[var(--color-ink-4)] hover:text-[var(--color-ink)]">Cancel</button>
        </div>
      )}

      {ticket.status === 'accepted' && (
        <button onClick={() => startWork.mutate(ticket._id)} disabled={startWork.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-green)] text-white text-sm hover:opacity-90 disabled:opacity-60 transition-all">
          {startWork.isPending ? <ButtonSpinner /> : <Play className="w-4 h-4" />} Start Work
        </button>
      )}

      {/* Complete DB Change — only for db_direct tickets that are in_progress or accepted */}
      {ticket.changeType === 'db_direct' && ['accepted', 'in_progress'].includes(ticket.status) && (
        <button onClick={() => completeDbChange?.mutate(ticket._id)} disabled={completeDbChange?.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-yellow)] text-[var(--color-ink)] text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-all">
          {completeDbChange?.isPending ? <ButtonSpinner /> : <Database className="w-4 h-4" />}
          Mark DB Change Done
        </button>
      )}
    </div>
  );
}

function SupportActions({ ticket }: { ticket: any }) {
  const { addFeedback, close } = useTicketAction();
  const [feedback, setFeedback] = useState(ticket.clientFeedback ?? '');
  const [remark, setRemark] = useState(ticket.supportRemark ?? '');
  if (!['pr_merged'].includes(ticket.status)) return null;
  return (
    <div className="px-6 py-5 border-t border-[var(--color-border)] bg-[var(--color-paper-2)] space-y-4">
      <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-3)]">Close Ticket</p>
      <div>
        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Client Feedback (optional)</label>
        <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={2} placeholder="What did the client say?"
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none resize-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Remark for Developer</label>
        <textarea value={remark} onChange={e => setRemark(e.target.value)} rows={2} placeholder="Great work! Quick turnaround..."
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none resize-none" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => addFeedback.mutate({ id: ticket._id, clientFeedback: feedback, supportRemark: remark })}
          disabled={addFeedback.isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm hover:bg-[var(--color-paper-2)] disabled:opacity-60">
          {addFeedback.isPending ? <ButtonSpinner /> : <MessageSquare className="w-4 h-4" />} Save Feedback
        </button>
        <button onClick={() => close.mutate(ticket._id)} disabled={close.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-green)] text-white text-sm hover:opacity-90 disabled:opacity-60 transition-all">
          {close.isPending ? <ButtonSpinner /> : <CheckCircle2 className="w-4 h-4" />} Close Ticket
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: ticket, isLoading } = useTicket(id!);
  const { data: developers } = useDevelopers();

  if (isLoading) return <PageLoader />;
  if (!ticket) return (
    <div className="text-center py-20">
      <p className="text-[var(--color-ink-3)]">Ticket not found.</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-sm text-[var(--color-accent)] underline">Go back</button>
    </div>
  );

  const project = ticket.projectId as any;
  const raiser = ticket.raisedBy as any;
  const assignee = ticket.assignedTo as any;
  const approver = ticket.approvedBy as any;
  const closer = ticket.closedBy as any;
  const mainDev = project?.mainDeveloper as any;

  return (
    <div className="w-[90%] animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[var(--color-ink-3)] hover:text-[var(--color-ink)] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="space-y-4">
        {/* ── Header card ── */}
        <div className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-[var(--shadow-sm)]">
          <div className="px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-2">
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-mono font-bold text-[var(--color-accent)]">{ticket.ticketNumber}</span>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                  <RequestTypeBadge requestType={ticket.requestType} />
                  {ticket.prRevisionCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
                      <RotateCcw className="w-3 h-3" /> {ticket.prRevisionCount} revision{ticket.prRevisionCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {/* Type label */}
                <p className="text-xs text-[var(--color-ink-3)]">
                  {(REQUEST_TYPE_LABELS as Record<string, string>)[ticket.requestType]} · {(STATUS_LABELS as Record<string, string>)[ticket.status]}
                </p>
              </div>
              <p className="text-xs text-[var(--color-ink-4)]">{formatRelative(ticket.createdAt)}</p>
            </div>
          </div>

          {/* ── Description ── */}
          <div className="px-6 py-5 border-b border-[var(--color-border)]">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-2">Description</p>
            <p className="text-sm text-[var(--color-ink)] leading-relaxed">{ticket.description}</p>
          </div>

          {/* ── People & Project ── */}
          <div className="px-6 py-5 border-b border-[var(--color-border)]">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-4">People & Project</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <Field icon={Building2} label="Brand / Project" value={project?.name} />
              <Field icon={User} label="Raised By" value={raiser?.name ? `${raiser.name} (${raiser.email})` : null} />
              <Field icon={Star} label="Main Developer" value={mainDev?.name ?? '—'} />
              <Field icon={UserCheck} label="Assigned Developer" value={assignee?.name ?? 'Not assigned'} />
              <Field icon={CheckCircle2} label="Approved By" value={approver?.name ?? '—'} />
              <Field icon={XCircle} label="Closed By" value={closer?.name ?? '—'} />
            </div>
          </div>

          {/* ── Dates & Timing ── */}
          <div className="px-6 py-5 border-b border-[var(--color-border)]">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-4">Dates & Timing</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <Field icon={Calendar} label="Created" value={formatDate(ticket.createdAt)} />
              <Field icon={Calendar} label="Required Delivery" value={ticket.requiredDeliveryDays ? `${ticket.requiredDeliveryDays} day(s)` : null} />
              <Field icon={Clock} label="Accepted At" value={ticket.acceptedAt ? formatDate(ticket.acceptedAt) : null} />
              <Field icon={Play} label="Work Started" value={ticket.devStartedAt ? formatDate(ticket.devStartedAt) : null} />
              <Field icon={Timer} label="Rollout ETA" value={ticket.devRolloutTime ? formatDate(ticket.devRolloutTime) : null} />
              <Field icon={CheckCircle2} label="Closed At" value={ticket.closedAt ? formatDate(ticket.closedAt) : null} />
              <Field icon={Clock} label="Resolution Time" value={ticket.resolutionHrs != null ? `${ticket.resolutionHrs} hrs` : null} />
            </div>
          </div>

          {/* ── PR Info ── */}
          {ticket.prStatus !== 'none' && (
            <div className="px-6 py-5 border-b border-[var(--color-border)]">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-4 flex items-center gap-1.5">
                <GitPullRequest className="w-3 h-3" /> Pull Request
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                <Field label="PR Status" value={ticket.prStatus.toUpperCase()} />
                <Field icon={RotateCcw} label="Revisions" value={ticket.prRevisionCount > 0 ? `${ticket.prRevisionCount} revision(s) requested` : null} />
              </div>
            </div>
          )}

          {/* ── Reference URLs ── */}
          {ticket.referenceUrls?.length > 0 && (
            <div className="px-6 py-5 border-b border-[var(--color-border)]">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-3 flex items-center gap-1.5">
                <Link2 className="w-3 h-3" /> Reference URLs
              </p>
              <div className="space-y-2">
                {ticket.referenceUrls.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-[var(--color-accent)] hover:underline">
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── Attachments ── */}
          {ticket.attachments?.length > 0 && (
            <div className="px-6 py-5 border-b border-[var(--color-border)]">
              <AttachmentGallery attachments={ticket.attachments} />
            </div>
          )}

          {/* ── Notes & Feedback ── */}
          <div className="px-6 py-5 border-b border-[var(--color-border)] space-y-3">
            {ticket.adminNotes && (
              <InfoBox color="bg-[var(--color-yellow-light)] border-[var(--color-yellow)]" label="Admin Notes">
                {ticket.adminNotes}
              </InfoBox>
            )}
            {ticket.rejectionReason && (
              <InfoBox color="bg-[var(--color-danger-light)] border-[var(--color-danger)] text-[var(--color-danger)]" label="Rejection Reason">
                {ticket.rejectionReason}
              </InfoBox>
            )}
            {ticket.clientFeedback && (
              <InfoBox color="bg-[var(--color-blue-light)] border-[var(--color-blue)]" label="Client Feedback">
                {ticket.clientFeedback}
              </InfoBox>
            )}
            {ticket.supportRemark && (
              <InfoBox color="bg-[var(--color-green-light)] border-[var(--color-green)]" label="Support Remark for Developer">
                {ticket.supportRemark}
              </InfoBox>
            )}
            {!ticket.adminNotes && !ticket.rejectionReason && !ticket.clientFeedback && !ticket.supportRemark && (
              <p className="text-xs text-[var(--color-ink-4)] italic">No notes or feedback yet.</p>
            )}
          </div>

          {/* ── Lifecycle Timeline ── */}
          <div className="px-6 py-5 border-b border-[var(--color-border)]">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-4">Lifecycle</p>
            <DynamicTimeline ticketId={ticket._id} />
          </div>

          {/* ── Role-specific Action Panels ── */}
          {user?.role === 'admin'     && <AdminActions ticket={ticket} developers={developers ?? []} />}
          {user?.role === 'developer' && <DeveloperActions ticket={ticket} />}
          {user?.role === 'support'   && <SupportActions ticket={ticket} />}
        </div>
      </div>
    </div>
  );
}
