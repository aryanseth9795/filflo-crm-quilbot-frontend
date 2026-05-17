import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';
import type { TicketPriority, TicketStatus } from '@/types/ticket';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (date: string | Date) =>
  format(new Date(date), 'dd MMM yyyy, HH:mm');

export const formatRelative = (date: string | Date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const priorityClass: Record<TicketPriority, string> = {
  P0: 'priority-critical',
  P1: 'priority-high',
  P2: 'priority-medium',
  P3: 'priority-low',
};

export const priorityLabel: Record<TicketPriority, string> = {
  P0: 'P0',
  P1: 'P1',
  P2: 'P2',
  P3: 'P3',
};

export const statusClass: Record<TicketStatus, string> = {
  open: 'badge-open',
  approved: 'badge-approved',
  accepted: 'badge-accepted',
  in_progress: 'badge-progress',
  pr_raised: 'badge-pr-raised',
  pr_review: 'badge-pr-review',
  pr_merged: 'badge-pr-merged',
  pr_rejected: 'badge-rejected',
  closed: 'badge-closed',
  rejected: 'badge-rejected',
};

export const statusLabel: Record<TicketStatus, string> = {
  open: 'Open',
  approved: 'Approved',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  pr_raised: 'PR Raised',
  pr_review: 'PR Review',
  pr_merged: 'PR Merged',
  pr_rejected: 'PR Rejected',
  closed: 'Closed',
  rejected: 'Rejected',
};
