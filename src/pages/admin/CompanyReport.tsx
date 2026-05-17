import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCompanyReport } from '@/hooks/useReports';
import { useProjects } from '@/hooks/useProjects';
import { PageLoader } from '@/components/common/LoadingSpinner';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
} from 'recharts';
import { ArrowLeft, Ticket, Clock, CheckCircle2, XCircle, Building2, Calendar } from 'lucide-react';
import { STATUS_LABELS, REQUEST_TYPE_LABELS } from '@/types/ticket';
import TimeFrameFilter, { getTimeFrameDates, type TimeFrame } from '@/components/common/TimeFrameFilter';
import { formatRelative } from '@/lib/utils';

const COLORS = ['var(--color-blue)', 'var(--color-green)', 'var(--color-yellow)', 'var(--color-accent)', 'var(--color-danger)', '#8884d8', '#82ca9d'];

export default function CompanyReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: projects } = useProjects();

  const [timeframe, setTimeframe] = useState<TimeFrame>('3m');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const { from, to } = useMemo(
    () => getTimeFrameDates(timeframe, customFrom, customTo),
    [timeframe, customFrom, customTo]
  );

  const { data, isLoading } = useCompanyReport(id!, from, to);

  const handleTimeFrameChange = (tf: TimeFrame, cf?: string, ct?: string) => {
    setTimeframe(tf);
    setCustomFrom(cf ?? '');
    setCustomTo(ct ?? '');
  };

  if (isLoading) return <PageLoader />;

  const reqTypeChartData = data?.requestTypeBreakdown?.map((r: any) => ({
    name: REQUEST_TYPE_LABELS[r._id as keyof typeof REQUEST_TYPE_LABELS] || r._id,
    Count: r.count,
  })).sort((a: any, b: any) => b.Count - a.Count) || [];

  const statusPieData = data?.statusBreakdown?.map((s: any) => ({
    name: STATUS_LABELS[s._id as keyof typeof STATUS_LABELS] || s._id,
    value: s.count,
  })) || [];

  const priorityPieData = data?.priorityBreakdown?.map((p: any) => ({
    name: p._id, value: p.count,
  })) || [];

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-[var(--color-ink-3)] hover:text-[var(--color-ink)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Reports
          </button>
          <div className="w-px h-4 bg-[var(--color-border)]" />
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[var(--color-accent)]" />
            <h1 className="font-serif text-2xl text-[var(--color-ink)]">
              {data?.project?.name ?? 'Company Report'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Company switcher */}
          <select
            value={id}
            onChange={(e) => navigate(`/admin/reports/company/${e.target.value}`)}
            className="text-sm px-3 py-1.5 border border-[var(--color-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--color-accent)] text-[var(--color-ink-2)]"
          >
            {projects?.map((p: any) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <TimeFrameFilter value={timeframe} customFrom={customFrom} customTo={customTo} onChange={handleTimeFrameChange} />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: data?.totalTickets, icon: Ticket, color: 'text-[var(--color-blue)]', bg: 'bg-[var(--color-blue-light)]' },
          { label: 'Open', value: data?.totalOpen, icon: XCircle, color: 'text-[var(--color-danger)]', bg: 'bg-[var(--color-danger-light)]' },
          { label: 'In Progress', value: data?.totalInProgress, icon: Clock, color: 'text-[var(--color-yellow)]', bg: 'bg-[var(--color-yellow-light)]' },
          { label: 'Closed', value: data?.totalClosed, icon: CheckCircle2, color: 'text-[var(--color-green)]', bg: 'bg-[var(--color-green-light)]' },
          { label: 'Avg Resolution', value: data?.avgResolutionHrs ? `${(data.avgResolutionHrs / 24).toFixed(1)} days` : '—', icon: Calendar, color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent-light)]' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-[var(--color-border)] rounded-2xl p-4 shadow-[var(--shadow-sm)] flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color} flex-shrink-0`}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-0.5">{kpi.label}</p>
              <p className="font-serif text-2xl text-[var(--color-ink)]">{kpi.value ?? 0}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-[var(--shadow-sm)]">
          <h3 className="font-serif text-lg text-[var(--color-ink)] mb-4">Status Breakdown</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" label={({ name, percent }) => (percent ?? 0) > 0.05 ? name : ''} labelLine={false} style={{ fontSize: '10px' }}>
                  {statusPieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-[var(--shadow-sm)]">
          <h3 className="font-serif text-lg text-[var(--color-ink)] mb-4">Priority Breakdown</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" label={({ name, percent }) => (percent ?? 0) > 0.05 ? name : ''} labelLine={false} style={{ fontSize: '10px' }}>
                  {priorityPieData.map((e: any, i: number) => <Cell key={i} fill={e.name === 'P0' ? 'var(--color-danger)' : e.name === 'P1' ? 'var(--color-accent)' : e.name === 'P2' ? 'var(--color-yellow)' : 'var(--color-green)'} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-[var(--shadow-sm)]">
          <h3 className="font-serif text-lg text-[var(--color-ink)] mb-4">Request Type Mix</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reqTypeChartData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-ink-4)' }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-ink-2)' }} width={80} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '12px' }} />
                <Bar dataKey="Count" fill="var(--color-blue)" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 12 Month Trend */}
      <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-[var(--shadow-sm)]">
        <h3 className="font-serif text-lg text-[var(--color-ink)] mb-4">Opened vs Closed — Last 12 Months</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.trend12Months} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-ink-4)' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-ink-4)' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '12px' }} />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '10px', fontWeight: 500 }} />
              <Line type="monotone" dataKey="Opened" stroke="var(--color-blue)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="Closed" stroke="var(--color-green)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Developer Workload */}
      <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h3 className="font-serif text-lg text-[var(--color-ink)]">Developer Workload (This Company)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-paper-2)] text-[var(--color-ink-3)] text-xs font-mono uppercase">
              <tr>
                <th className="px-5 py-3 font-medium">Developer</th>
                <th className="px-5 py-3 font-medium text-right">Assigned</th>
                <th className="px-5 py-3 font-medium text-right">Active</th>
                <th className="px-5 py-3 font-medium text-right">Closed</th>
                <th className="px-5 py-3 font-medium text-right">Overdue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {data?.developerStats?.map((d: any) => (
                <tr key={d._id} className="hover:bg-[var(--color-paper-2)]">
                  <td className="px-5 py-3 font-medium text-[var(--color-ink)]">{d.name}</td>
                  <td className="px-5 py-3 text-right">{d.assigned}</td>
                  <td className="px-5 py-3 text-[var(--color-yellow)] font-medium text-right">{d.active}</td>
                  <td className="px-5 py-3 text-[var(--color-green)] font-medium text-right">{d.closed}</td>
                  <td className="px-5 py-3 text-[var(--color-danger)] font-medium text-right">{d.overdue > 0 ? d.overdue : '—'}</td>
                </tr>
              ))}
              {(!data?.developerStats || data.developerStats.length === 0) && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-[var(--color-ink-4)] text-sm">No developer data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h3 className="font-serif text-lg text-[var(--color-ink)]">Recent Tickets</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-paper-2)] text-[var(--color-ink-3)] text-xs font-mono uppercase">
              <tr>
                <th className="px-5 py-3 font-medium">Ticket</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Assigned To</th>
                <th className="px-5 py-3 font-medium text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {data?.recentTickets?.map((t: any) => (
                <tr key={t._id} className="hover:bg-[var(--color-paper-2)] cursor-pointer" onClick={() => navigate(`/admin/tickets/${t._id}`)}>
                  <td className="px-5 py-3 font-medium text-[var(--color-accent)]">{t.ticketNumber}</td>
                  <td className="px-5 py-3 text-[var(--color-ink-2)]">{STATUS_LABELS[t.status as keyof typeof STATUS_LABELS] || t.status}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${t.priority === 'P0' ? 'bg-red-100 text-red-700' : t.priority === 'P1' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.priority}</span>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-ink-2)]">{(t.assignedTo as any)?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-right text-[var(--color-ink-4)]">{formatRelative(t.createdAt)}</td>
                </tr>
              ))}
              {(!data?.recentTickets || data.recentTickets.length === 0) && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-[var(--color-ink-4)] text-sm">No recent tickets</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
