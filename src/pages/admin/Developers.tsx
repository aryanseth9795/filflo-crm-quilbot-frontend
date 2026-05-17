import { useDevelopers } from '@/hooks/useDevelopers';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { Code2, Briefcase, ExternalLink, Clock, Target } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function Developers() {
  const { data: developers, isLoading } = useDevelopers();

  if (isLoading) return <PageLoader />;

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <div>
        <h1 className="font-serif text-3xl text-[var(--color-ink)]">Developer Team</h1>
        <p className="text-[var(--color-ink-3)] text-sm mt-1">Monitor developer load, skills, and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {developers?.map((dev: any) => {
          const profile = dev.profile || {};
          const prRate = profile.prAcceptRate ?? 0;
          
          return (
            <div key={dev._id} className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-md transition-shadow duration-300 flex flex-col group">
              {/* Header */}
              <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between bg-gradient-to-r from-white to-[var(--color-paper)]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#f0f7ff] text-[#0066cc] flex items-center justify-center text-xl font-serif font-bold group-hover:scale-105 transition-transform">
                    {dev.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-[var(--color-ink)]">{dev.name}</h3>
                    <p className="text-xs text-[var(--color-ink-4)] font-mono">{dev.email}</p>
                  </div>
                </div>
                {profile.githubUsername && (
                  <a 
                    href={`https://github.com/${profile.githubUsername}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 text-[var(--color-ink-4)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
              
              <div className="p-6 bg-white flex-1 space-y-6">
                {/* Core Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--color-paper)] p-3 rounded-xl border border-[var(--color-border)]">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-1 flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3" /> Current Load
                    </p>
                    <p className="text-2xl font-serif text-[var(--color-ink)]">
                      {profile.currentLoad ?? 0}
                    </p>
                  </div>
                  <div className="bg-[var(--color-paper)] p-3 rounded-xl border border-[var(--color-border)]">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-1 flex items-center gap-1.5">
                      <Code2 className="w-3 h-3 text-[var(--color-green)]" /> Completed
                    </p>
                    <p className="text-2xl font-serif text-[var(--color-ink)]">
                      {profile.totalCompleted ?? 0}
                    </p>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-xs font-medium text-[var(--color-ink-3)] flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> PR Accept Rate
                      </span>
                      <span className="text-sm font-bold text-[var(--color-ink)]">{prRate}%</span>
                    </div>
                    <div className="h-2 w-full bg-[var(--color-paper-2)] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${prRate > 80 ? 'bg-[var(--color-green)]' : prRate > 50 ? 'bg-[var(--color-yellow)]' : 'bg-[var(--color-danger)]'}`} 
                        style={{ width: `${prRate}%` }} 
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)] border-dashed">
                    <span className="text-xs font-medium text-[var(--color-ink-3)] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Avg Resolution Time
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-ink)]">{profile.avgResolutionHrs ?? 0} <span className="text-[var(--color-ink-4)] font-normal text-xs">hrs</span></span>
                  </div>
                </div>

                {/* Skills & Domains */}
                <div className="space-y-3">
                  {profile.skills && profile.skills.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.skills.map((skill: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-[#f0f7ff] text-[#0066cc] border border-[#dbeafe] rounded-md text-[10px] font-medium whitespace-nowrap">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.domains && profile.domains.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-2 mt-3">Domains</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.domains.map((domain: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-[#faf5ff] text-[#6b21a8] border border-[#f3e8ff] rounded-md text-[10px] font-medium whitespace-nowrap">
                            {domain}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
              
              <div className="px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-paper)] text-right">
                <p className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-ink-4)]">Joined • {formatDate(dev.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
