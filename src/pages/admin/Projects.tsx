import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects, useCreateProject } from '@/hooks/useProjects';
import { useDevelopers } from '@/hooks/useDevelopers';
import { FolderOpen, Plus } from 'lucide-react';
import { PageLoader } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import type { Project } from '@/types/project';
import { formatDate } from '@/lib/utils';

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const { data: developers } = useDevelopers();
  const createMutation = useCreateProject();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', githubRepoUrl: '', mainDeveloper: '' });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form, {
      onSuccess: () => {
        setShowForm(false);
        setForm({ name: '', description: '', githubRepoUrl: '', mainDeveloper: '' });
      }
    });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="animate-fade-in space-y-8 max-w-5x mx-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-[var(--color-ink)]">Projects</h1>
          <p className="text-[var(--color-ink-3)] text-sm mt-1">Manage client projects and GitHub webhook integrations</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium hover:bg-[var(--color-ink-2)] transition-all">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-[var(--shadow-sm)] animate-slide-in">
          <h2 className="font-serif text-xl text-[var(--color-ink)] mb-4">Create New Project</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">Project Name <span className="text-[var(--color-danger)]">*</span></label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="e.g. Acme React App"
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] text-sm focus:outline-none focus:border-[var(--color-accent)]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">GitHub Repo URL</label>
                <input type="url" value={form.githubRepoUrl} onChange={(e) => set('githubRepoUrl', e.target.value)} placeholder="https://github.com/org/repo"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] text-sm focus:outline-none focus:border-[var(--color-accent)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">Main Developer</label>
                <select value={form.mainDeveloper} onChange={(e) => set('mainDeveloper', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] text-sm focus:outline-none focus:border-[var(--color-accent)]">
                  <option value="">No main developer assigned</option>
                  {developers?.map((d: any) => (
                    <option key={d._id} value={d._id}>{d.name} (Load: {d.profile?.currentLoad ?? 0})</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={createMutation.isPending}
                className="px-4 py-2 rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium disabled:opacity-60 transition-all">
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-ink-2)] hover:bg-[var(--color-paper-2)]">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {!projects?.length && !showForm ? (
        <EmptyState icon={<FolderOpen className="w-6 h-6" />} title="No projects yet" description="Create a project to start receiving tickets and linking GitHub PRs." />
      ) : (
        <div className="grid gap-4">
          {projects?.map((project: Project) => (
            <Link key={project._id} to={`/admin/projects/${project._id}`}
              className="bg-white border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-ink-3)] transition-all group flex items-start justify-between">
              <div>
                <h3 className="font-serif text-lg text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">{project.name}</h3>
                {project.githubRepoUrl && <p className="text-xs font-mono text-[var(--color-ink-4)] mt-1">{project.githubRepoUrl}</p>}
                {project.mainDeveloper && typeof project.mainDeveloper === 'object' && (
                  <p className="text-xs font-medium text-[var(--color-ink-3)] mt-2 flex items-center gap-1">⭐ Main Dev: {project.mainDeveloper.name}</p>
                )}
                {project.description && <p className="text-sm text-[var(--color-ink-3)] mt-2">{project.description}</p>}
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase bg-[var(--color-green-light)] text-[var(--color-green)]">Active</span>
                <p className="text-xs text-[var(--color-ink-4)] mt-2">Added {formatDate(project.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
