import { useState } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useToggleUserActive } from '@/hooks/useUsers';
import { PageLoader } from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import {
  Users as UsersIcon, Plus, ShieldCheck, Code2, Headphones,
  ToggleLeft, ToggleRight, Eye, EyeOff, Pencil, X,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

type UserRole = 'admin' | 'developer' | 'support';

const ROLE_META: Record<UserRole, { label: string; icon: React.ElementType; bg: string; text: string; border: string }> = {
  admin:     { label: 'Admin',     icon: ShieldCheck, bg: 'bg-[var(--color-accent-light)]', text: 'text-[var(--color-accent)]', border: 'border-[var(--color-accent)]'  },
  developer: { label: 'Developer', icon: Code2,       bg: 'bg-[var(--color-green-light)]',  text: 'text-[var(--color-green)]',  border: 'border-[var(--color-green)]'    },
  support:   { label: 'Support',   icon: Headphones,  bg: 'bg-[var(--color-blue-light)]',   text: 'text-[var(--color-blue)]',   border: 'border-[var(--color-blue)]'     },
};

const AVATAR_BG: Record<UserRole, string> = {
  admin:     'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
  developer: 'bg-[var(--color-green-light)]  text-[var(--color-green)]',
  support:   'bg-[var(--color-blue-light)]   text-[var(--color-blue)]',
};

const EMPTY_CREATE = { name: '', email: '', password: '', role: 'support' as UserRole };

const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] text-sm focus:outline-none focus:border-[var(--color-accent)]';
const labelCls = 'block text-sm font-medium text-[var(--color-ink-2)] mb-1.5';

function RoleBadge({ role }: { role: UserRole }) {
  const m = ROLE_META[role];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${m.bg} ${m.text} ${m.border}`}>
      <Icon className="w-3 h-3" />{m.label}
    </span>
  );
}

export default function Users() {
  const { data: users, isLoading } = useUsers();
  const createMutation  = useCreateUser();
  const updateMutation  = useUpdateUser();
  const toggleMutation  = useToggleUserActive();

  // Create form state
  const [showCreate, setShowCreate]     = useState(false);
  const [createForm, setCreateForm]     = useState(EMPTY_CREATE);
  const [showPassword, setShowPassword] = useState(false);

  // Edit panel state
  const [editingUser, setEditingUser]   = useState<any | null>(null);
  const [editForm, setEditForm]         = useState({ name: '', email: '', role: 'support' as UserRole });

  const [roleFilter, setRoleFilter]     = useState<UserRole | 'all'>('all');

  const setCreate = (k: string, v: string) => setCreateForm((p) => ({ ...p, [k]: v }));
  const setEdit   = (k: string, v: string) => setEditForm((p) => ({ ...p, [k]: v }));

  const openEdit = (user: any) => {
    setShowCreate(false);
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
  };
  const closeEdit = () => setEditingUser(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(createForm, {
      onSuccess: () => { setShowCreate(false); setCreateForm(EMPTY_CREATE); setShowPassword(false); },
    });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ id: editingUser._id, ...editForm }, { onSuccess: closeEdit });
  };

  if (isLoading) return <PageLoader />;

  const filtered = roleFilter === 'all' ? users : users?.filter((u: any) => u.role === roleFilter);

  const counts = {
    all:       users?.length ?? 0,
    admin:     users?.filter((u: any) => u.role === 'admin').length     ?? 0,
    developer: users?.filter((u: any) => u.role === 'developer').length ?? 0,
    support:   users?.filter((u: any) => u.role === 'support').length   ?? 0,
  };

  return (
    <div className="animate-fade-in space-y-8 pb-10">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-[var(--color-ink)]">User Management</h1>
          <p className="text-[var(--color-ink-3)] text-sm mt-1">Create accounts and manage roles across your team</p>
        </div>
        <button
          onClick={() => { setShowCreate((v) => !v); closeEdit(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium hover:bg-[var(--color-ink-2)] transition-all shadow-[var(--shadow-sm)]"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* ── Create Form ─────────────────────────────────────────────────────── */}
      {showCreate && (
        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-[var(--shadow-sm)] animate-slide-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl text-[var(--color-ink)]">Create New User</h2>
            <button onClick={() => { setShowCreate(false); setCreateForm(EMPTY_CREATE); }} className="text-[var(--color-ink-4)] hover:text-[var(--color-ink)]">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name <span className="text-[var(--color-danger)]">*</span></label>
                <input type="text" value={createForm.name} onChange={(e) => setCreate('name', e.target.value)}
                  required placeholder="e.g. Jane Smith" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email <span className="text-[var(--color-danger)]">*</span></label>
                <input type="email" value={createForm.email} onChange={(e) => setCreate('email', e.target.value)}
                  required placeholder="jane@company.com" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Password <span className="text-[var(--color-danger)]">*</span></label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={createForm.password}
                    onChange={(e) => setCreate('password', e.target.value)}
                    required minLength={8} placeholder="Min. 8 characters"
                    className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-4)] hover:text-[var(--color-ink-2)]">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Role <span className="text-[var(--color-danger)]">*</span></label>
                <select value={createForm.role} onChange={(e) => setCreate('role', e.target.value)} className={inputCls}>
                  <option value="support">Support</option>
                  <option value="developer">Developer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={createMutation.isPending}
                className="px-5 py-2 rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium disabled:opacity-60 hover:bg-[var(--color-ink-2)] transition-all">
                {createMutation.isPending ? 'Creating…' : 'Create User'}
              </button>
              <button type="button" onClick={() => { setShowCreate(false); setCreateForm(EMPTY_CREATE); setShowPassword(false); }}
                className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-ink-2)] hover:bg-[var(--color-paper-2)]">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Edit Panel ──────────────────────────────────────────────────────── */}
      {editingUser && (
        <div className="bg-white border border-[var(--color-accent)] rounded-2xl p-6 shadow-[var(--shadow-sm)] animate-slide-in">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-serif font-bold ${AVATAR_BG[editingUser.role as UserRole] ?? AVATAR_BG.support}`}>
                {editingUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-serif text-xl text-[var(--color-ink)]">Edit User</h2>
                <p className="text-xs font-mono text-[var(--color-ink-4)]">{editingUser.email}</p>
              </div>
            </div>
            <button onClick={closeEdit} className="text-[var(--color-ink-4)] hover:text-[var(--color-ink)]">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name <span className="text-[var(--color-danger)]">*</span></label>
                <input type="text" value={editForm.name} onChange={(e) => setEdit('name', e.target.value)}
                  required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email <span className="text-[var(--color-danger)]">*</span></label>
                <input type="email" value={editForm.email} onChange={(e) => setEdit('email', e.target.value)}
                  required className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Role <span className="text-[var(--color-danger)]">*</span></label>
              <div className="grid grid-cols-3 gap-3">
                {(['support', 'developer', 'admin'] as UserRole[]).map((r) => {
                  const m = ROLE_META[r];
                  const Icon = m.icon;
                  const selected = editForm.role === r;
                  return (
                    <button key={r} type="button" onClick={() => setEdit('role', r)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        selected
                          ? `${m.border} ${m.bg} ${m.text}`
                          : 'border-[var(--color-border)] text-[var(--color-ink-3)] hover:border-[var(--color-ink-3)]'
                      }`}>
                      <Icon className="w-4 h-4" />{m.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={updateMutation.isPending}
                className="px-5 py-2 rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium disabled:opacity-60 hover:bg-[var(--color-ink-2)] transition-all">
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" onClick={closeEdit}
                className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-ink-2)] hover:bg-[var(--color-paper-2)]">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Role Filter Tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-[var(--color-paper-2)] p-1 rounded-xl border border-[var(--color-border)] w-fit">
        {(['all', 'admin', 'developer', 'support'] as const).map((r) => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              roleFilter === r
                ? 'bg-white text-[var(--color-ink)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--color-ink-4)] hover:text-[var(--color-ink-2)]'
            }`}>
            {r === 'all' ? 'All' : ROLE_META[r].label}
            <span className="ml-1.5 text-[10px] font-mono opacity-60">{counts[r]}</span>
          </button>
        ))}
      </div>

      {/* ── User Table ───────────────────────────────────────────────────────── */}
      {!filtered?.length ? (
        <EmptyState
          icon={<UsersIcon className="w-6 h-6" />}
          title="No users found"
          description={roleFilter === 'all' ? 'Add the first user to get started.' : `No ${roleFilter} users yet.`}
        />
      ) : (
        <div className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-[var(--shadow-sm)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-paper)]">
                <th className="text-left px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)]">User</th>
                <th className="text-left px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)]">Role</th>
                <th className="text-left px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)] hidden md:table-cell">Joined</th>
                <th className="text-left px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)]">Status</th>
                <th className="px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.map((user: any) => {
                const role: UserRole = user.role in ROLE_META ? user.role : 'support';
                const isEditing = editingUser?._id === user._id;
                return (
                  <tr key={user._id}
                    className={`transition-colors group ${isEditing ? 'bg-[var(--color-accent-light)]' : 'hover:bg-[var(--color-paper)]'}`}>

                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-serif font-bold flex-shrink-0 ${AVATAR_BG[role]}`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--color-ink)]">{user.name}</p>
                          <p className="text-xs font-mono text-[var(--color-ink-4)]">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4"><RoleBadge role={role} /></td>

                    {/* Joined */}
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-xs font-mono text-[var(--color-ink-4)]">{formatDate(user.createdAt)}</span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <button onClick={() => toggleMutation.mutate(user._id)} disabled={toggleMutation.isPending}
                        className="flex items-center gap-1.5"
                        title={user.isActive ? 'Deactivate user' : 'Activate user'}>
                        {user.isActive ? (
                          <><ToggleRight className="w-5 h-5 text-[var(--color-green)]" /><span className="text-xs font-medium text-[var(--color-green)]">Active</span></>
                        ) : (
                          <><ToggleLeft className="w-5 h-5 text-[var(--color-ink-4)]" /><span className="text-xs font-medium text-[var(--color-ink-4)]">Inactive</span></>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => isEditing ? closeEdit() : openEdit(user)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isEditing
                            ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                            : 'border-[var(--color-border)] text-[var(--color-ink-3)] hover:border-[var(--color-ink-3)] hover:text-[var(--color-ink)]'
                        }`}
                        title="Edit user">
                        <Pencil className="w-3.5 h-3.5" />
                        {isEditing ? 'Editing' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
