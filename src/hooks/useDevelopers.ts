import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useDevelopers = () => {
  return useQuery({
    queryKey: ['developers'],
    queryFn: () => api.get('/users/developers').then((r) => r.data.data.developers),
    staleTime: 60_000,
  });
};

export const useDeveloperProfile = (id: string) => {
  return useQuery({
    queryKey: ['developer-profile', id],
    queryFn: () => api.get(`/users/${id}/profile`).then((r) => r.data.data),
    enabled: !!id,
  });
};
