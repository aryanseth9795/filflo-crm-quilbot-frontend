import { useAuthStore } from '@/stores/auth.store';
import { useDeveloperProfile } from '@/hooks/useDevelopers';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { Code2, Briefcase, Star, Clock } from 'lucide-react';

export default function DeveloperProfile() {
  const { user } = useAuthStore();
  const { data, isLoading } = useDeveloperProfile(user!._id);

  if (isLoading) return <PageLoader />;
  if (!data) return <div>Profile not found</div>;

  const { profile } = data;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-8 mt-10">
      <div className="bg-white border border-[var(--color-border)] rounded-2xl p-8 shadow-[var(--shadow-sm)] text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-[var(--color-green-light)] to-[var(--color-blue-light)] opacity-50" />
        <div className="relative z-10">
          <div className="w-24 h-24 mx-auto rounded-full bg-[var(--color-ink)] text-white flex items-center justify-center text-3xl font-serif mb-4 shadow-[var(--shadow-md)]">
            {user?.name.charAt(0)}
          </div>
          <h1 className="font-serif text-3xl text-[var(--color-ink)]">{user?.name}</h1>
          <p className="text-[var(--color-ink-3)] font-mono text-sm mt-1">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
          <div className="flex items-center gap-3 text-[var(--color-ink-4)] mb-2 uppercase tracking-widest text-xs font-mono">
            <Briefcase className="w-4 h-4" /> Current Load
          </div>
          <p className="text-3xl font-semibold text-[var(--color-ink)]">{profile?.currentLoad ?? 0} <span className="text-sm font-normal text-[var(--color-ink-3)]">tasks</span></p>
        </div>
        <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
          <div className="flex items-center gap-3 text-[var(--color-ink-4)] mb-2 uppercase tracking-widest text-xs font-mono">
            <Code2 className="w-4 h-4" /> Total Completed
          </div>
          <p className="text-3xl font-semibold text-[var(--color-ink)]">{profile?.totalCompleted ?? 0} <span className="text-sm font-normal text-[var(--color-ink-3)]">tasks</span></p>
        </div>
        <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
          <div className="flex items-center gap-3 text-[var(--color-ink-4)] mb-2 uppercase tracking-widest text-xs font-mono">
            <Clock className="w-4 h-4" /> Avg Resolution
          </div>
          <p className="text-3xl font-semibold text-[var(--color-ink)]">{profile?.avgResolutionHrs ?? 0} <span className="text-sm font-normal text-[var(--color-ink-3)]">hrs</span></p>
        </div>
        <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
          <div className="flex items-center gap-3 text-[var(--color-ink-4)] mb-2 uppercase tracking-widest text-xs font-mono">
            <Star className="w-4 h-4" /> PR Accept Rate
          </div>
          <p className="text-3xl font-semibold text-[var(--color-ink)]">{profile?.prAcceptRate ?? 0}%</p>
        </div>
      </div>
    </div>
  );
}
