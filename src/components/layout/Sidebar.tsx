import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Ticket, FolderOpen, Users, BarChart2, LogOut, Headphones, Code2, ChevronRight, UserCog } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const navByRole = {
  support: [
    { to: '/support', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/support/new', label: 'Raise Ticket', icon: Ticket },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/new-ticket', label: 'Raise Ticket', icon: Ticket },
    { to: '/admin/tickets', label: 'Ticket Queue', icon: Ticket },
    { to: '/admin/projects', label: 'Projects', icon: FolderOpen },
    { to: '/admin/developers', label: 'Developers', icon: Users },
    { to: '/admin/users', label: 'User Management', icon: UserCog },
    { to: '/admin/reports', label: 'Reports', icon: BarChart2 },
    { to: '/admin/happiness-index', label: 'Happiness Index', icon: BarChart2 },
  ],
  developer: [
    { to: '/developer', label: 'My Tasks', icon: LayoutDashboard },
    { to: '/developer/profile', label: 'My Profile', icon: Code2 },
  ],
};

const roleIcon = { support: Headphones, admin: LayoutDashboard, developer: Code2 };
const roleColor = { support: 'text-[var(--color-blue)]', admin: 'text-[var(--color-accent)]', developer: 'text-[var(--color-green)]' };

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleLogout = async () => {
    await api.post('/auth/logout');
    logout();
    qc.clear();
    navigate('/login');
  };

  if (!user) return null;
  const navItems = navByRole[user.role];
  const RoleIcon = roleIcon[user.role];

  return (
    <aside className="w-60 h-screen flex flex-col border-r border-[var(--color-border)] bg-white sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-ink)] flex items-center justify-center">
            <span className="text-white text-xs font-bold font-mono">FL</span>
          </div>
          <span className="font-serif text-lg text-[var(--color-ink)]">Filflo CRM</span>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 mx-3 mt-4 rounded-lg bg-[var(--color-paper-2)] border border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--color-ink)] flex items-center justify-center text-white text-xs font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-ink)] truncate">{user.name}</p>
            <p className={cn('text-xs font-mono uppercase tracking-wide', roleColor[user.role])}>
              <RoleIcon className="inline w-3 h-3 mr-1" />{user.role}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin' || to === '/support' || to === '/developer'}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group',
              isActive
                ? 'bg-[var(--color-ink)] text-white'
                : 'text-[var(--color-ink-3)] hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)]'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-colors duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
