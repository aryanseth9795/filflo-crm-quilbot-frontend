import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

export default function ForgotPassword() {
  const { resetPasswordMutation } = useAuth();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetPasswordMutation.mutate({ email, newPassword });
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] text-[var(--color-ink)] text-sm placeholder-[var(--color-ink-4)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)] transition-all';

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-ink)] mb-4">
            <span className="text-white text-sm font-bold font-mono">FL</span>
          </div>
          <h1 className="font-serif text-3xl text-[var(--color-ink)]">Reset password</h1>
          <p className="text-[var(--color-ink-3)] mt-1 text-sm">
            Enter your email and choose a new password
          </p>
        </div>

        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-8 shadow-[var(--shadow-md)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">
                Email address
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className={inputClass}
              />
            </div>

            {/* New password with show/hide */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">
                New password
              </label>
              <div className="relative">
                <input
                  id="reset-new-password"
                  type={showPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium hover:bg-[var(--color-ink-2)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
            >
              {resetPasswordMutation.isPending
                ? 'Updating password...'
                : <><KeyRound className="w-4 h-4" />Update password</>}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--color-ink-3)] mt-6">
            Remembered it?{' '}
            <Link to="/login" className="text-[var(--color-accent)] font-medium hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
