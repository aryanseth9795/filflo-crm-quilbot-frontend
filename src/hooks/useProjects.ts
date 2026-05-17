import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import type { CreateProjectPayload } from '@/types/project';

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then((r) => r.data.data.projects),
    staleTime: 60_000,
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectPayload) =>
      api.post('/projects', data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CreateProjectPayload> & { id: string }) =>
      api.patch(`/projects/${id}`, data).then((r) => r.data.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project', variables.id] });
      toast.success('Project updated!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useRegenerateSecret = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/projects/${id}/regenerate-secret`).then((r) => r.data.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Webhook secret regenerated!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
