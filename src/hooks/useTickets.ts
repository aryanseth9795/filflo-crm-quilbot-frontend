import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api, { createFormData } from '@/lib/api';
import type {
  TicketFilters,
  ApproveTicketPayload,
  RejectTicketPayload,
  ReviewPRPayload,
  AddFeedbackPayload,
} from '@/types/ticket';

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['tickets'] });
  qc.invalidateQueries({ queryKey: ['my-tickets'] });
  qc.invalidateQueries({ queryKey: ['ticket'] });
};

export const useTickets = (filters?: TicketFilters) =>
  useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => api.get('/tickets', { params: filters }).then((r) => r.data.data),
    staleTime: 30_000,
  });

export const useMyTickets = (params?: { page?: number; limit?: number; status?: string; from?: string; to?: string; projectId?: string; approvedBy?: string }) => {
  const { page = 1, limit = 10, status, from, to, projectId, approvedBy } = params ?? {};
  return useQuery({
    queryKey: ['my-tickets', { page, limit, status, from, to, projectId, approvedBy }],
    queryFn: () =>
      api.get('/tickets/mine', { params: { page, limit, ...(status && { status }), ...(from && { from }), ...(to && { to }), ...(projectId && { projectId }), ...(approvedBy && { approvedBy }) } })
         .then((r) => r.data.data),
    staleTime: 30_000,
  });
};

export const useTicketTimeline = (id: string) =>
  useQuery({
    queryKey: ['ticket-timeline', id],
    queryFn: () => api.get(`/tickets/${id}/timeline`).then((r) => r.data.data.timeline),
    enabled: !!id,
    staleTime: 60_000,
  });

export const useTicket = (id: string) =>
  useQuery({
    queryKey: ['ticket', id],
    queryFn: () => api.get(`/tickets/${id}`).then((r) => r.data.data.ticket),
    enabled: !!id,
  });

export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fields, files }: { fields: Record<string, string | number | undefined>; files: File[] }) => {
      const form = createFormData(fields, files, 'attachments');
      return api.post('/tickets', form, { headers: { 'Content-Type': 'multipart/form-data' } })
                .then((r) => r.data.data.ticket);
    },
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Ticket raised successfully!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useAddAttachments = (ticketId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => {
      const form = createFormData({}, files, 'attachments');
      return api.post(`/tickets/${ticketId}/attachments`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
                .then((r) => r.data.data.ticket);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success('Attachments uploaded!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useTicketAction = () => {
  const qc = useQueryClient();

  const approve = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & ApproveTicketPayload) =>
      api.patch(`/tickets/${id}/approve`, data).then((r) => r.data),
    onSuccess: () => { invalidateAll(qc); toast.success('Ticket approved and developer notified!'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const reject = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & RejectTicketPayload) =>
      api.patch(`/tickets/${id}/reject`, data).then((r) => r.data),
    onSuccess: () => { invalidateAll(qc); toast.success('Ticket rejected.'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const acceptTask = useMutation({
    mutationFn: ({ id, changeType }: { id: string; changeType: 'code' | 'db_direct' }) =>
      api.patch(`/tickets/${id}/accept`, { changeType }).then((r) => r.data),
    onSuccess: () => { invalidateAll(qc); toast.success('Task accepted! Your timer has started.'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const startWork = useMutation({
    mutationFn: (id: string) => api.patch(`/tickets/${id}/start`).then((r) => r.data),
    onSuccess: () => { invalidateAll(qc); toast.success('Work started!'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const setRollout = useMutation({
    mutationFn: ({ id, devRolloutTime }: { id: string; devRolloutTime: string }) =>
      api.patch(`/tickets/${id}/rollout`, { devRolloutTime }).then((r) => r.data),
    onSuccess: () => { invalidateAll(qc); toast.success('Rollout time set!'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const reviewPR = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & ReviewPRPayload) =>
      api.patch(`/tickets/${id}/review-pr`, data).then((r) => r.data),
    onSuccess: (_, vars) => {
      invalidateAll(qc);
      toast.success(vars.action === 'merge' ? 'PR merged! Support has been notified.' : 'PR rejected. Developer will be notified.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addFeedback = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & AddFeedbackPayload) =>
      api.patch(`/tickets/${id}/feedback`, data).then((r) => r.data),
    onSuccess: () => { invalidateAll(qc); toast.success('Feedback saved!'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const close = useMutation({
    mutationFn: (id: string) => api.patch(`/tickets/${id}/close`).then((r) => r.data),
    onSuccess: () => { invalidateAll(qc); toast.success('Ticket closed successfully!'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const completeDbChange = useMutation({
    mutationFn: (id: string) => api.patch(`/tickets/${id}/complete-db-change`).then((r) => r.data),
    onSuccess: () => { invalidateAll(qc); toast.success('DB change marked complete! Support can now close the ticket.'); },
    onError: (err: Error) => toast.error(err.message),
  });

  return { approve, reject, acceptTask, startWork, setRollout, reviewPR, addFeedback, close, completeDbChange };
};
