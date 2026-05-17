import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import type { UserRole } from '@/types/user';

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: 'support', label: 'Support Team', desc: 'Raise and track tickets' },
  { value: 'developer', label: 'Developer', desc: 'Work on assigned tasks' },
];

export default function Signup() {
  const { signupMutation } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'support' as UserRole, companyName: '' });
  const [showPwd, setShowPwd] = useState(false);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate(form);
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] text-[var(--color-ink)] text-sm placeholder-[var(--color-ink-4)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)] transition-all';

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-ink)] mb-4">
            <span className="text-white text-sm font-bold font-mono">FL</span>
          </div>
          <h1 className="font-serif text-3xl text-[var(--color-ink)]">Create account</h1>
          <p className="text-[var(--color-ink-3)] mt-1 text-sm">Join Filflo CRM</p>
        </div>

        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-8 shadow-[var(--shadow-md)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => (
                  <button key={r.value} type="button" onClick={() => set('role', r.value)}
                    className={`p-3 rounded-lg border text-left transition-all duration-150 ${form.role === r.value ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]' : 'border-[var(--color-border)] hover:border-[var(--color-ink-3)]'}`}>
                    <p className={`text-sm font-medium ${form.role === r.value ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink)]'}`}>{r.label}</p>
                    <p className="text-xs text-[var(--color-ink-3)] mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
                placeholder="Aryan Shah"
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
                placeholder="aryan@company.com"
                className={inputClass}
              />
            </div>

            {/* Password with show/hide toggle */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  required
                  placeholder="••••••••"
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-4)] hover:text-[var(--color-ink-2)] transition-colors"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Company (optional) */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">Company (optional)</label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => set('companyName', e.target.value)}
                placeholder="Acme Corp"
                className={inputClass}
              />
            </div>

            <button type="submit" disabled={signupMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium hover:bg-[var(--color-ink-2)] disabled:opacity-60 transition-all">
              {signupMutation.isPending ? 'Creating account...' : <><UserPlus className="w-4 h-4" />Create account</>}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--color-ink-3)] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--color-accent)] font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
