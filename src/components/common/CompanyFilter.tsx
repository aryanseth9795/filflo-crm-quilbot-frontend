import { Building2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';

interface CompanyFilterProps {
  value: string;
  onChange: (projectId: string) => void;
}

export default function CompanyFilter({ value, onChange }: CompanyFilterProps) {
  const { data: projects } = useProjects();

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-white">
        <Building2 className="w-3.5 h-3.5 text-[var(--color-ink-4)] flex-shrink-0" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs font-medium text-[var(--color-ink-2)] bg-transparent border-none outline-none cursor-pointer pr-1"
        >
          <option value="">All Companies</option>
          {projects?.map((p: any) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
