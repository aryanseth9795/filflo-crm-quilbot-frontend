import { cn, statusClass, statusLabel, priorityClass, priorityLabel } from '@/lib/utils';
import type { TicketPriority, TicketRequestType, TicketStatus } from '@/types/ticket';
import { REQUEST_TYPE_LABELS } from '@/types/ticket';

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wide whitespace-nowrap', statusClass[status])}>
      {statusLabel[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wide', priorityClass[priority])}>
      {priorityLabel[priority]}
    </span>
  );
}

const REQUEST_TYPE_COLORS: Record<TicketRequestType, string> = {
  bug:             'bg-red-50 text-red-700',
  error:           'bg-orange-50 text-orange-700',
  ui_ux_change:    'bg-blue-50 text-blue-700',
  feature_request: 'bg-purple-50 text-purple-700',
  special_request: 'bg-yellow-50 text-yellow-700',
  miscellaneous:   'bg-gray-100 text-gray-600',
};

export function RequestTypeBadge({ requestType }: { requestType: TicketRequestType }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap', REQUEST_TYPE_COLORS[requestType])}>
      {REQUEST_TYPE_LABELS[requestType]}
    </span>
  );
}
