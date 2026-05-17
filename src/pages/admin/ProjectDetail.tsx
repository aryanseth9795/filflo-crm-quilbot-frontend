import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useRegenerateSecret, useUpdateProject } from '@/hooks/useProjects';
import { useDevelopers } from '@/hooks/useDevelopers';
import { PageLoader, ButtonSpinner } from '@/components/common/LoadingSpinner';
import { ArrowLeft, Copy, RefreshCw, GitBranch, Check, Edit2, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useProject(id!);
  const { data: developers } = useDevelopers();
  const regenMutation = useRegenerateSecret();
  const updateMutation = useUpdateProject();
  
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  
  const [isEditingDev, setIsEditingDev] = useState(false);
  const [selectedDev, setSelectedDev] = useState('');

  useEffect(() => {
    if (data?.project?.mainDeveloper) {
      setSelectedDev((data.project.mainDeveloper as any)._id);
    }
  }, [data]);

  if (isLoading) return <PageLoader />;
  if (!data) return <div>Project not found</div>;

  const { project, webhookUrl, webhookSecret } = data;

  const handleCopy = (text: string, type: 'url' | 'secret') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleUpdateDev = () => {
    updateMutation.mutate(
      { id: id!, mainDeveloper: selectedDev },
      { onSuccess: () => setIsEditingDev(false) }
    );
  };

  return (
    <div className="max-w-5xl animate-fade-in">
      <button onClick={() => navigate('/admin/projects')} className="flex items-center gap-2 text-sm text-[var(--color-ink-3)] hover:text-[var(--color-ink)] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to projects
      </button>

      <div className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-[var(--shadow-sm)]">
        <div className="px-6 py-6 border-b border-[var(--color-border)] relative group">
          <h1 className="font-serif text-2xl text-[var(--color-ink)]">{project.name}</h1>
          {project.githubRepoUrl && (
            <a href={project.githubRepoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-mono text-[var(--color-ink-4)] hover:text-[var(--color-ink)] mt-2 transition-colors">
              <GitBranch className="w-4 h-4" /> {project.githubRepoUrl}
            </a>
          )}
          {project.description && <p className="text-sm text-[var(--color-ink-2)] mt-3">{project.description}</p>}

          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-1">Main Developer</p>
                {isEditingDev ? (
                  <div className="flex items-center gap-2 mt-1">
                    <select value={selectedDev} onChange={(e) => setSelectedDev(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] text-sm focus:outline-none focus:border-[var(--color-accent)] min-w-[200px]">
                      <option value="">None assigned</option>
                      {developers?.map((d: any) => (
                        <option key={d._id} value={d._id}>{d.name} (Load: {d.profile?.currentLoad ?? 0})</option>
                      ))}
                    </select>
                    <button onClick={handleUpdateDev} disabled={updateMutation.isPending}
                      className="p-1.5 rounded-lg bg-[var(--color-green)] text-white hover:opacity-90 disabled:opacity-60 transition-all">
                      {updateMutation.isPending ? <ButtonSpinner /> : <Check className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { setIsEditingDev(false); setSelectedDev((project.mainDeveloper as any)?._id ?? ''); }}
                      className="p-1.5 rounded-lg bg-[var(--color-paper-3)] text-[var(--color-ink-2)] hover:bg-[var(--color-paper-4)] transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/dev">
                    <p className="text-sm font-medium text-[var(--color-ink-2)] flex items-center gap-1.5">
                      {project.mainDeveloper ? `⭐ ${(project.mainDeveloper as any).name}` : 'Not assigned'}
                    </p>
                    <button onClick={() => setIsEditingDev(true)}
                      className="p-1 text-[var(--color-ink-4)] hover:text-[var(--color-accent)] opacity-0 group-hover/dev:opacity-100 transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 bg-[var(--color-paper-2)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg text-[var(--color-ink)]">GitHub Webhook Setup</h2>
            <button onClick={() => regenMutation.mutate(id!)} disabled={regenMutation.isPending}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-2)] transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${regenMutation.isPending ? 'animate-spin' : ''}`} />
              Regenerate Secret
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-1.5">Payload URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-white border border-[var(--color-border)] text-sm font-mono text-[var(--color-ink)] overflow-x-auto whitespace-nowrap">
                  {webhookUrl}
                </code>
                <button onClick={() => handleCopy(webhookUrl, 'url')} className="p-2 rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-ink-3)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)] transition-all">
                  {copiedUrl ? <Check className="w-4 h-4 text-[var(--color-green)]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-1.5">Secret</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-white border border-[var(--color-border)] text-sm font-mono text-[var(--color-ink)]">
                  {webhookSecret}
                </code>
                <button onClick={() => handleCopy(webhookSecret, 'secret')} className="p-2 rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-ink-3)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)] transition-all">
                  {copiedSecret ? <Check className="w-4 h-4 text-[var(--color-green)]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg border border-[var(--color-blue)] border-opacity-30 bg-[var(--color-blue-light)]">
            <h3 className="text-sm font-semibold text-[var(--color-blue)] mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside text-sm text-[var(--color-ink-2)] space-y-1">
              <li>Go to your GitHub repository settings.</li>
              <li>Click on <strong>Webhooks</strong>, then <strong>Add webhook</strong>.</li>
              <li>Paste the <strong>Payload URL</strong> and <strong>Secret</strong> above.</li>
              <li>Set Content type to <code className="bg-white px-1 py-0.5 rounded text-xs border border-[var(--color-border)]">application/json</code>.</li>
              <li>Select <strong>Let me select individual events</strong> and check <strong>Pull requests</strong>.</li>
              <li>Click <strong>Add webhook</strong>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
