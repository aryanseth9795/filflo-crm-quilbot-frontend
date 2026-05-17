import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export const useAuth = () => {
  const { user, isAuthenticated, setUser, logout: clearStore } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post('/auth/login', data).then((r) => r.data.data.user),
    onSuccess: (user) => {
      setUser(user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : user.role === 'developer' ? '/developer' : '/support');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const signupMutation = useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role: string; companyName?: string }) =>
      api.post('/auth/signup', data).then((r) => r.data.data.user),
    onSuccess: (user) => {
      setUser(user);
      toast.success('Account created!');
      navigate(user.role === 'admin' ? '/admin' : user.role === 'developer' ? '/developer' : '/support');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      clearStore();
      queryClient.clear();
      navigate('/login');
    },
  });

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data.user),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { email: string; newPassword: string }) =>
      api.post('/auth/reset-password', data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Password updated! Please log in with your new password.');
      navigate('/login');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { user, isAuthenticated, loginMutation, signupMutation, logoutMutation, meQuery, resetPasswordMutation };
};
