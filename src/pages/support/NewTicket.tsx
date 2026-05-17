import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useProjects } from '@/hooks/useProjects';
import { ArrowLeft, Send, Upload, X, Paperclip, AlertCircle, User } from 'lucide-react';
import { ButtonSpinner, Skeleton } from '@/components/common/LoadingSpinner';
import { formatBytes } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth.store';
import type { TicketRequestType, TicketPriority } from '@/types/ticket';

const REQUEST_TYPES: { value: TicketRequestType; label: string; desc: string }[] = [
  { value: 'bug',             label: 'Bug',             desc: 'Something is broken' },
  { value: 'error',           label: 'Error',           desc: 'System/runtime error' },
  { value: 'ui_ux_change',    label: 'UI/UX Change',    desc: 'Design or flow tweak' },
  { value: 'feature_request', label: 'Feature Request', desc: 'New functionality' },
  { value: 'special_request', label: 'Special Request', desc: 'One-off custom work' },
  { value: 'miscellaneous',   label: 'Miscellaneous',   desc: 'Anything else' },
];

const PRIORITIES: { value: TicketPriority; label: string; desc: string; color: string }[] = [
  { value: 'P0', label: 'P0', desc: 'Critical — immediate', color: 'border-red-400 bg-red-50 text-red-700' },
  { value: 'P1', label: 'P1', desc: 'High — urgent',        color: 'border-orange-400 bg-orange-50 text-orange-700' },
  { value: 'P2', label: 'P2', desc: 'Medium — normal',      color: 'border-yellow-400 bg-yellow-50 text-yellow-700' },
  { value: 'P3', label: 'P3', desc: 'Low — when time',      color: 'border-green-400 bg-green-50 text-green-700' },
];

const MAX_BYTES = 50 * 1024 * 1024; // 50MB

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/');
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  return (
    <div className="flex items-center gap-3 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-lg p-2 pr-3 animate-slide-up">
      {isImage && preview ? (
        <div className="w-10 h-10 rounded-md bg-[var(--color-paper-3)] overflow-hidden flex-shrink-0 border border-[var(--color-border)]">
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-md bg-[var(--color-paper-3)] flex items-center justify-center flex-shrink-0 border border-[var(--color-border)]">
          <Paperclip className="w-5 h-5 text-[var(--color-ink-4)]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-ink)] truncate" title={file.name}>{file.name}</p>
        <p className="text-xs text-[var(--color-ink-4)] mt-0.5">{formatBytes(file.size)}</p>
      </div>
      <button type="button" onClick={onRemove}
        className="p-1.5 text-[var(--color-ink-4)] hover:text-[var(--color-danger)] hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
        title="Remove file">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function NewTicket() {
  const navigate = useNavigate();
  const role = useAuthStore(s => s.user?.role);
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const [form, setForm] = useState({
    projectId: '',
    requestType: '' as TicketRequestType | '',
    description: '',
    priority: 'P2' as TicketPriority,
    requiredDeliveryDays: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [referenceUrls, setReferenceUrls] = useState<string[]>(['']);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addUrl = () => setReferenceUrls(u => [...u, '']);
  const removeUrl = (i: number) => setReferenceUrls(u => u.filter((_, idx) => idx !== i));
  const updateUrl = (i: number, val: string) => setReferenceUrls(u => u.map((v, idx) => idx === i ? val : v));

  const selectedProject = projects?.find((p: any) => p._id === form.projectId);
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const usedPercent = Math.min(100, (totalBytes / MAX_BYTES) * 100);

  const set = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const onDrop = useCallback((accepted: File[]) => {
    setFiles(prev => {
      const next = [...prev, ...accepted];
      const total = next.reduce((s, f) => s + f.size, 0);
      if (total > MAX_BYTES) {
        setErrors(e => ({ ...e, files: 'Total size exceeds 50 MB limit' }));
        return prev;
      }
      setErrors(e => { const n = { ...e }; delete n['files']; return n; });
      return next;
    });
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/') || item.type === 'application/pdf' || item.type.startsWith('video/')) {
          const file = item.getAsFile();
          if (file) {
            // Give pasted images a better name if it's just 'image.png'
            const isGenericName = file.name === 'image.png' || file.name === 'image.jpg';
            if (isGenericName && item.type.startsWith('image/')) {
              const ext = file.type.split('/')[1] || 'png';
              pastedFiles.push(new File([file], `Pasted-Image-${Date.now()}.${ext}`, { type: file.type }));
            } else {
              pastedFiles.push(file);
            }
          }
        }
      }

      if (pastedFiles.length > 0) {
        onDrop(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [], 'application/pdf': [],
      'video/mp4': [], 'video/webm': [], 'video/quicktime': [],
    },
    maxSize: MAX_BYTES,
  });

  const removeFile = (i: number) => {
    setFiles(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      const total = next.reduce((s, f) => s + f.size, 0);
      if (total <= MAX_BYTES) setErrors(e => { const n = { ...e }; delete n['files']; return n; });
      return next;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.projectId) e['projectId'] = 'Please select a project';
    if (!form.requestType) e['requestType'] = 'Please select a request type';
    if (form.description.trim().length < 10) e['description'] = 'Description must be at least 10 characters';
    const validUrls = referenceUrls.filter(u => u.trim() !== '');
    for (const url of validUrls) {
      try { new URL(url); } catch { e['referenceUrls'] = 'One or more URLs are invalid'; break; }
    }
    return e;
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // Build FormData manually so referenceUrls are repeated keys (multer parses them as an array)
    const formData = new FormData();
    formData.append('projectId', form.projectId);
    formData.append('requestType', form.requestType);
    formData.append('description', form.description.trim());
    formData.append('priority', form.priority);
    if (form.requiredDeliveryDays) formData.append('requiredDeliveryDays', form.requiredDeliveryDays);
    referenceUrls.filter(u => u.trim() !== '').forEach(url => formData.append('referenceUrls', url));
    files.forEach(f => formData.append('attachments', f));

    setSubmitting(true);
    try {
      await api.post('/tickets', formData);
      toast.success('Ticket raised successfully!');
      navigate(role === 'admin' ? '/admin/tickets' : '/support');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl animate-fade-in">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-[var(--color-ink-3)] hover:text-[var(--color-ink)] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-6">
        <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] mb-1">New Issue</p>
        <h1 className="font-serif text-3xl text-[var(--color-ink)]">Raise a Ticket</h1>
        <p className="text-[var(--color-ink-3)] text-sm mt-1">Fill in the details — our team will review it shortly.</p>
      </div>

      <div className="bg-white border border-[var(--color-border)] rounded-2xl p-8 shadow-[var(--shadow-sm)]">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Project / Brand */}
          <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">
              Brand (Project) <span className="text-[var(--color-danger)]">*</span>
            </label>
            {projectsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <select value={form.projectId} onChange={e => set('projectId', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border bg-[var(--color-paper)] text-[var(--color-ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-light)] transition-all ${errors['projectId'] ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)] focus:border-[var(--color-accent)]'}`}>
                <option value="">Select a project / brand</option>
                {projects?.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            )}
            {errors['projectId'] && <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors['projectId']}</p>}

            {/* Main developer info */}
            {selectedProject?.mainDeveloper && (
              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-ink-3)] bg-[var(--color-paper-2)] rounded-lg px-3 py-2">
                <User className="w-3 h-3" />
                <span>Main developer: <strong className="text-[var(--color-ink-2)]">{(selectedProject.mainDeveloper as any)?.name ?? 'Unassigned'}</strong></span>
              </div>
            )}
          </div>

          {/* Request Type */}
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
              Request Type <span className="text-[var(--color-danger)]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {REQUEST_TYPES.map(rt => (
                <button key={rt.value} type="button" onClick={() => set('requestType', rt.value)}
                  className={`flex flex-col items-start px-3 py-2.5 rounded-lg border text-left transition-all hover:shadow-sm ${form.requestType === rt.value ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-ink-3)] hover:border-[var(--color-ink-3)]'}`}>
                  <span className="text-xs font-semibold">{rt.label}</span>
                  <span className="text-[10px] opacity-70 mt-0.5">{rt.desc}</span>
                </button>
              ))}
            </div>
            {errors['requestType'] && <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors['requestType']}</p>}
          </div>

          {/* Priority */}
          <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
              Priority <span className="text-[var(--color-danger)]">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map(p => (
                <button key={p.value} type="button" onClick={() => set('priority', p.value)}
                  className={`flex flex-col items-center px-2 py-2.5 rounded-lg border text-center transition-all ${form.priority === p.value ? p.color + ' border-current shadow-sm' : 'border-[var(--color-border)] text-[var(--color-ink-3)] hover:border-[var(--color-ink-3)]'}`}>
                  <span className="text-sm font-bold font-mono">{p.label}</span>
                  <span className="text-[10px] mt-0.5 opacity-80 leading-tight">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">
              Description <span className="text-[var(--color-danger)]">*</span>
            </label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5}
              placeholder="Describe the issue in detail — what happened, what was expected, and steps to reproduce..."
              className={`w-full px-4 py-3 rounded-lg border bg-[var(--color-paper)] text-[var(--color-ink)] text-sm placeholder-[var(--color-ink-4)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-light)] transition-all resize-none ${errors['description'] ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)] focus:border-[var(--color-accent)]'}`} />
            {errors['description'] && <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors['description']}</p>}
          </div>

          {/* Required Delivery Days */}
          <div className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">Required Delivery (days)</label>
            <input type="number" min={1} value={form.requiredDeliveryDays}
              onChange={e => set('requiredDeliveryDays', e.target.value)}
              placeholder="e.g. 3"
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] text-[var(--color-ink)] text-sm focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)] transition-all" />
          </div>

          {/* Reference URLs */}
          <div className="animate-slide-up" style={{ animationDelay: '0.275s' }}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[var(--color-ink-2)]">
                Reference URLs <span className="text-[var(--color-ink-4)] font-normal">(Google Docs, Sheets, Figma, etc.)</span>
              </label>
              <button type="button" onClick={addUrl}
                className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1">
                + Add URL
              </button>
            </div>
            <div className="space-y-2">
              {referenceUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={e => updateUrl(i, e.target.value)}
                    placeholder="https://docs.google.com/..."
                    className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] text-[var(--color-ink)] text-sm focus:outline-none focus:border-[var(--color-accent)] transition-all"
                  />
                  {referenceUrls.length > 1 && (
                    <button type="button" onClick={() => removeUrl(i)}
                      className="p-2 text-[var(--color-ink-4)] hover:text-[var(--color-danger)] hover:bg-red-50 rounded-md transition-colors flex-shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors['referenceUrls'] && <p className="text-xs text-[var(--color-danger)] mt-1">{errors['referenceUrls']}</p>}
          </div>


          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">
              Attachments <span className="text-[var(--color-ink-4)] font-normal">(images, PDFs, videos — 50 MB total)</span>
            </label>

            {/* Drop zone */}
            <div {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragActive ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]' : 'border-[var(--color-border)] hover:border-[var(--color-ink-3)]'}`}>
              <input {...getInputProps()} />
              <Upload className={`w-8 h-8 mx-auto mb-2 transition-colors ${isDragActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-4)]'}`} />
              {isDragActive
                ? <p className="text-sm text-[var(--color-accent)] font-medium">Drop files here</p>
                : <><p className="text-sm text-[var(--color-ink-3)]">Drag & drop files here, or <span className="text-[var(--color-accent)] underline">browse</span></p>
                    <p className="text-xs text-[var(--color-ink-4)] mt-1">Images, PDF, MP4, WebM — 50 MB total</p></>}
            </div>

            {/* Usage bar */}
            {files.length > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-[var(--color-ink-3)] mb-1">
                  <span>{files.length} file{files.length > 1 ? 's' : ''}</span>
                  <span className={totalBytes > MAX_BYTES * 0.9 ? 'text-[var(--color-danger)]' : ''}>{formatBytes(totalBytes)} / 50 MB</span>
                </div>
                <div className="h-1.5 bg-[var(--color-paper-3)] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${usedPercent > 90 ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-accent)]'}`}
                    style={{ width: `${usedPercent}%` }} />
                </div>
              </div>
            )}

            {/* File previews */}
            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {files.map((f, i) => (
                  <FilePreview key={`${f.name}-${i}`} file={f} onRemove={() => removeFile(i)} />
                ))}
              </div>
            )}
            {errors['files'] && <p className="text-xs text-[var(--color-danger)] mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors['files']}</p>}
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium hover:bg-[var(--color-ink-2)] disabled:opacity-60 transition-all hover:shadow-md active:scale-[0.99]">
            {submitting ? <><ButtonSpinner /> Submitting…</> : <><Send className="w-4 h-4" /> Submit Ticket</>}
          </button>
        </form>
      </div>
    </div>
  );
}
