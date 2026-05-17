import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTicket, useTicketAction } from '@/hooks/useTickets';
import { useAuth } from '@/hooks/useAuth';
import { useDevelopers } from '@/hooks/useDevelopers';
import { StatusBadge, PriorityBadge, RequestTypeBadge } from '@/components/tickets/StatusBadge';
import { PageLoader, ButtonSpinner } from '@/components/common/LoadingSpinner';
import { formatDate, formatBytes } from '@/lib/utils';
import {
  ArrowLeft, CheckCircle2, XCircle, UserCheck, GitMerge, GitPullRequestClosed,
  Paperclip, RotateCcw, Calendar, Clock, User, FileText, ExternalLink, X
} from 'lucide-react';
import type { Attachment } from '@/types/ticket';

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-0.5">{label}</p>
      <p className="text-sm text-[var(--color-ink-2)]">{value}</p>
    </div>
  );
}

function AttachmentGallery({ attachments }: { attachments: Attachment[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (!attachments.length) return null;

  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-3 flex items-center gap-2">
        <Paperclip className="w-3.5 h-3.5" /> Attachments ({attachments.length})
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {attachments.map((att, i) => {
          const isImage = att.mimeType.startsWith('image/');
          return (
            <div key={i} className="group relative rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-paper-2)] aspect-square flex items-center justify-center cursor-pointer hover:border-[var(--color-accent)] transition-colors animate-fade-in"
              onClick={() => isImage ? setLightbox(att.secureUrl) : window.open(att.secureUrl, '_blank')}>
              {isImage ? (
                <img src={att.secureUrl} alt={att.fileName} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 p-2">
                  <FileText className="w-6 h-6 text-[var(--color-ink-3)]" />
                  <span className="text-[9px] text-[var(--color-ink-4)] text-center leading-tight truncate w-full">{att.fileName}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ExternalLink className="w-4 h-4 text-white" />
              </div>
              <div className="absolute bottom-1 right-1 text-[8px] bg-black/60 text-white px-1 rounded">{formatBytes(att.sizeBytes)}</div>
            </div>
          );
        })}
      </div>

      {lightbox && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"><X className="w-6 h-6" /></button>
          <img src={lightbox} alt="Preview" className="max-w-full max-h-[90vh] rounded-xl shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

export default function TicketReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: ticket, isLoading } = useTicket(id!);
  const { data: developers } = useDevelopers();
  const { approve, reject, reviewPR } = useTicketAction();

  const [selectedDev, setSelectedDev] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [prRejectNotes, setPrRejectNotes] = useState('');
  const [mode, setMode] = useState<'view' | 'approve' | 'reject' | 'pr-reject'>('view');

  if (isLoading) return <PageLoader />;
  if (!ticket) return <div className="text-center py-20 text-[var(--color-ink-3)]">Ticket not found</div>;

  const project = ticket.projectId as any;
  const raiser = ticket.raisedBy as any;
  const assignee = ticket.assignedTo as any;
  const mainDev = project?.mainDeveloper as any;

  const handleApprove = () => {
    if (!selectedDev) return;
    approve.mutate({ id: id!, assignedTo: selectedDev, adminNotes }, { onSuccess: () => setMode('view') });
  };
  const handleReject = () => {
    if (!rejectionReason) return;
    reject.mutate({ id: id!, rejectionReason }, { onSuccess: () => setMode('view') });
  };
  const handleMergePR = () => reviewPR.mutate({ id: id!, action: 'merge' }, { onSuccess: () => setMode('view') });
  const handleRejectPR = () => reviewPR.mutate({ id: id!, action: 'reject', notes: prRejectNotes }, { onSuccess: () => setMode('view') });

  const canApproveOrReject = ticket.status === 'open' && user?.role === 'admin';
  const canReviewPR = ticket.status === 'pr_raised' && user?.role === 'admin';

  return (
    <div className="max-w-3xl animate-fade-in">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-[var(--color-ink-3)] hover:text-[var(--color-ink)] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to queue
      </button>

      <div className="space-y-4">
        {/* Header card */}
        <div className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-[var(--shadow-sm)]">
          <div className="px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-mono font-bold text-[var(--color-accent)]">{ticket.ticketNumber}</span>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                  <RequestTypeBadge requestType={ticket.requestType} />
                  {ticket.prRevisionCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
                      <RotateCcw className="w-3 h-3" /> {ticket.prRevisionCount} revision{ticket.prRevisionCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--color-ink-3)]">Project: <strong className="text-[var(--color-ink-2)]">{project?.name ?? '—'}</strong></p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Description */}
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-2">Description</p>
              <p className="text-sm text-[var(--color-ink-2)] leading-relaxed">{ticket.description}</p>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoRow label="Raised By" value={raiser?.name ?? '—'} />
              <InfoRow label="Assigned To" value={assignee?.name ?? '—'} />
              {mainDev && <InfoRow label="Main Developer" value={mainDev?.name} />}
              <InfoRow label="Required Delivery" value={ticket.requiredDeliveryDays ? `${ticket.requiredDeliveryDays} day(s)` : null} />
              <InfoRow label="Created" value={formatDate(ticket.createdAt)} />
              <InfoRow label="PR Status" value={ticket.prStatus} />
              {ticket.devRolloutTime && <InfoRow label="Rollout Time" value={formatDate(ticket.devRolloutTime)} />}
              {ticket.resolutionHrs && <InfoRow label="Resolution" value={`${ticket.resolutionHrs} hrs`} />}
            </div>

            {/* Attachments */}
            <AttachmentGallery attachments={ticket.attachments ?? []} />

            {/* Notes boxes */}
            {ticket.adminNotes && (
              <div className="px-4 py-3 rounded-lg bg-[var(--color-yellow-light)] border-l-4 border-[var(--color-yellow)]">
                <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-yellow)] mb-1">Admin Notes</p>
                <p className="text-sm text-[var(--color-ink-2)]">{ticket.adminNotes}</p>
              </div>
            )}
            {ticket.rejectionReason && (
              <div className="px-4 py-3 rounded-lg bg-[var(--color-danger-light)] border-l-4 border-[var(--color-danger)]">
                <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-danger)] mb-1">Rejection Reason</p>
                <p className="text-sm text-[var(--color-ink-2)]">{ticket.rejectionReason}</p>
              </div>
            )}
            {ticket.clientFeedback && (
              <div className="px-4 py-3 rounded-lg bg-[var(--color-blue-light)] border-l-4 border-[var(--color-blue)]">
                <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-blue)] mb-1">Client Feedback</p>
                <p className="text-sm text-[var(--color-ink-2)]">{ticket.clientFeedback}</p>
              </div>
            )}
            {ticket.supportRemark && (
              <div className="px-4 py-3 rounded-lg bg-[var(--color-green-light)] border-l-4 border-[var(--color-green)]">
                <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-green)] mb-1">Support Remark for Developer</p>
                <p className="text-sm text-[var(--color-ink-2)]">{ticket.supportRemark}</p>
              </div>
            )}
          </div>

          {/* Admin actions */}
          {user?.role === 'admin' && (
            <div className="px-6 py-5 border-t border-[var(--color-border)] bg-[var(--color-paper-2)] space-y-3">
              {/* PR Review */}
              {canReviewPR && mode === 'view' && (
                <div className="flex gap-2 flex-wrap">
                  <button onClick={handleMergePR} disabled={reviewPR.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#166534] text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-all">
                    {reviewPR.isPending ? <ButtonSpinner /> : <GitMerge className="w-4 h-4" />} Merge PR
                  </button>
                  <button onClick={() => setMode('pr-reject')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-danger)] text-white text-sm font-medium hover:opacity-90 transition-all">
                    <GitPullRequestClosed className="w-4 h-4" /> Reject PR
                  </button>
                </div>
              )}

              {/* PR Reject form */}
              {mode === 'pr-reject' && (
                <div className="space-y-3 animate-slide-up">
                  <textarea value={prRejectNotes} onChange={e => setPrRejectNotes(e.target.value)} rows={2}
                    placeholder="Reason for rejecting this PR..."
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:border-[var(--color-danger)] resize-none" />
                  <div className="flex gap-2">
                    <button onClick={handleRejectPR} disabled={reviewPR.isPending}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-danger)] text-white text-sm font-medium disabled:opacity-60 transition-all">
                      {reviewPR.isPending ? <ButtonSpinner /> : <GitPullRequestClosed className="w-4 h-4" />} Confirm Reject
                    </button>
                    <button onClick={() => setMode('view')} className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-ink-2)] hover:bg-white transition-all">Cancel</button>
                  </div>
                </div>
              )}

              {/* Approve / Reject ticket */}
              {canApproveOrReject && mode === 'view' && (
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setMode('approve')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-green)] text-white text-sm font-medium hover:opacity-90 transition-all">
                    <CheckCircle2 className="w-4 h-4" /> Approve & Assign
                  </button>
                  <button onClick={() => setMode('reject')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-danger)] text-white text-sm font-medium hover:opacity-90 transition-all">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}

              {/* Approve form */}
              {mode === 'approve' && (
                <div className="space-y-3 animate-slide-up">
                  <select value={selectedDev} onChange={e => setSelectedDev(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:border-[var(--color-accent)]">
                    <option value="">Select developer to assign</option>
                    {mainDev && <option value={mainDev._id}>⭐ {mainDev.name} (Main Dev)</option>}
                    {developers?.filter((d: any) => d._id !== mainDev?._id).map((d: any) =>
                      <option key={d._id} value={d._id}>{d.name} (Load: {d.profile?.currentLoad ?? 0})</option>
                    )}
                  </select>
                  <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2}
                    placeholder="Notes for the developer (optional)..."
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none" />
                  <div className="flex gap-2">
                    <button onClick={handleApprove} disabled={!selectedDev || approve.isPending}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-green)] text-white text-sm font-medium disabled:opacity-60 hover:opacity-90 transition-all">
                      {approve.isPending ? <ButtonSpinner /> : <UserCheck className="w-4 h-4" />} Approve & Assign
                    </button>
                    <button onClick={() => setMode('view')} className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-ink-2)] hover:bg-white transition-all">Cancel</button>
                  </div>
                </div>
              )}

              {/* Reject form */}
              {mode === 'reject' && (
                <div className="space-y-3 animate-slide-up">
                  <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={2}
                    placeholder="Reason for rejection..."
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:border-[var(--color-danger)] resize-none" />
                  <div className="flex gap-2">
                    <button onClick={handleReject} disabled={!rejectionReason || reject.isPending}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-danger)] text-white text-sm font-medium disabled:opacity-60 hover:opacity-90 transition-all">
                      {reject.isPending ? <ButtonSpinner /> : <XCircle className="w-4 h-4" />} Reject Ticket
                    </button>
                    <button onClick={() => setMode('view')} className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-ink-2)] hover:bg-white transition-all">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
