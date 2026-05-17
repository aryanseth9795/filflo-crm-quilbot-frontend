import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const { loginMutation } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-ink)] mb-4">
            <span className="text-white text-sm font-bold font-mono">FL</span>
          </div>
          <h1 className="font-serif text-3xl text-[var(--color-ink)]">Welcome back</h1>
          <p className="text-[var(--color-ink-3)] mt-1 text-sm">Sign in to your Filflo CRM account</p>
        </div>

        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-8 shadow-[var(--shadow-md)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] text-[var(--color-ink)] text-sm placeholder-[var(--color-ink-4)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[var(--color-ink-2)]">Password</label>
                <Link to="/forgot-password" className="text-xs text-[var(--color-accent)] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] text-[var(--color-ink)] text-sm placeholder-[var(--color-ink-4)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)] transition-all"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-4)] hover:text-[var(--color-ink-2)] transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium hover:bg-[var(--color-ink-2)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
            >
              {loginMutation.isPending ? 'Signing in...' : <><LogIn className="w-4 h-4" /> Sign in</>}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--color-ink-3)] mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[var(--color-accent)] font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
