import { useQuery } from '@tanstack/react-query';
import { UserCog } from 'lucide-react';
import api from '@/lib/api';

function useAdmins() {
  return useQuery({
    queryKey: ['admins'],
    queryFn: () => api.get('/users/admins').then((r) => r.data.data.admins),
    staleTime: 300_000,
  });
}

interface AdminFilterProps {
  value: string;
  onChange: (adminId: string) => void;
}

export default function AdminFilter({ value, onChange }: AdminFilterProps) {
  const { data: admins } = useAdmins();

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-white">
        <UserCog className="w-3.5 h-3.5 text-[var(--color-ink-4)] flex-shrink-0" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs font-medium text-[var(--color-ink-2)] bg-transparent border-none outline-none cursor-pointer pr-1"
        >
          <option value="">All Admins</option>
          {admins?.map((a: any) => (
            <option key={a._id} value={a._id}>{a.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
