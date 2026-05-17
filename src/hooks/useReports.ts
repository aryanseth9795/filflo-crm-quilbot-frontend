import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useReportOverview = (from?: string, to?: string) => {
  return useQuery({
    queryKey: ['report-overview', from, to],
    queryFn: () => api.get('/reports', { params: { from, to } }).then((r) => r.data.data),
    staleTime: 60_000,
  });
};

export const useHappinessIndex = (from?: string, to?: string) => {
  return useQuery({
    queryKey: ['happiness-index', from, to],
    queryFn: () => api.get('/reports/happiness-index', { params: { from, to } }).then((r) => r.data.data.companies),
    staleTime: 60_000,
  });
};

export const useCompanyReport = (projectId: string, from?: string, to?: string) => {
  return useQuery({
    queryKey: ['company-report', projectId, from, to],
    queryFn: () => api.get(`/reports/company/${projectId}`, { params: { from, to } }).then((r) => r.data.data),
    enabled: !!projectId,
    staleTime: 60_000,
  });
};

export const useDeveloperStats = (from?: string, to?: string) => {
  return useQuery({
    queryKey: ['dev-stats', from, to],
    queryFn: () => api.get('/reports/developers', { params: { from, to } }).then((r) => r.data.data.developers),
    staleTime: 60_000,
  });
};

export const exportReport = async (from?: string, to?: string) => {
  const res = await api.get('/reports/export', {
    params: { from, to },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'filflo-report.csv';
  a.click();
  URL.revokeObjectURL(url);
};
