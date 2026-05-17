export type TicketRequestType =
  | 'bug'
  | 'error'
  | 'ui_ux_change'
  | 'feature_request'
  | 'special_request'
  | 'miscellaneous';

export type TicketPriority = 'P0' | 'P1' | 'P2' | 'P3';

export type TicketStatus =
  | 'open'
  | 'approved'
  | 'accepted'
  | 'in_progress'
  | 'pr_raised'
  | 'pr_review'
  | 'pr_merged'
  | 'pr_rejected'
  | 'closed'
  | 'rejected';

export type PRStatus = 'none' | 'open' | 'merged' | 'rejected';

export interface Attachment {
  url: string;
  secureUrl: string;
  publicId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface Ticket {
  _id: string;
  ticketNumber: string;
  projectId: { _id: string; name: string; githubRepoUrl?: string; mainDeveloper?: { _id: string; name: string; email: string } } | string;
  requestType: TicketRequestType;
  description: string;
  priority: TicketPriority;
  requiredDeliveryDays?: number;
  raisedBy: { _id: string; name: string; email: string } | string;
  referenceUrls: string[];
  attachments: Attachment[];
  totalAttachmentBytes: number;
  status: TicketStatus;
  approvedBy?: { _id: string; name: string } | string;
  adminNotes?: string;
  rejectionReason?: string;
  assignedTo?: { _id: string; name: string; email: string } | string;
  changeType?: 'code' | 'db_direct';
  acceptedAt?: string;
  devStartedAt?: string;
  devRolloutTime?: string;
  prStatus: PRStatus;
  prRevisionCount: number;
  clientFeedback?: string;
  supportRemark?: string;
  closedBy?: { _id: string; name: string } | string;
  closedAt?: string;
  resolutionHrs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketPayload {
  projectId: string;
  requestType: TicketRequestType;
  description: string;
  priority: TicketPriority;
  requiredDeliveryDays?: number;
  referenceUrls?: string[];
  // files handled as FormData
}

export interface ApproveTicketPayload {
  assignedTo: string;
  adminNotes?: string;
}

export interface RejectTicketPayload {
  rejectionReason: string;
}

export interface ReviewPRPayload {
  action: 'merge' | 'reject';
  notes?: string;
}

export interface AddFeedbackPayload {
  clientFeedback?: string;
  supportRemark?: string;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  requestType?: TicketRequestType;
  assignedTo?: string;
  unassigned?: boolean;
  projectId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface TicketListResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const REQUEST_TYPE_LABELS: Record<TicketRequestType, string> = {
  bug: 'Bug',
  error: 'Error',
  ui_ux_change: 'UI/UX Change',
  feature_request: 'Feature Request',
  special_request: 'Special Request',
  miscellaneous: 'Miscellaneous',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  P0: 'P0 — Critical',
  P1: 'P1 — High',
  P2: 'P2 — Medium',
  P3: 'P3 — Low',
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
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
