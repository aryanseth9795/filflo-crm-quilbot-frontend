import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportOverview, useHappinessIndex, useDeveloperStats, exportReport } from '@/hooks/useReports';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from 'recharts';
import { Download, Ticket, Clock, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { STATUS_LABELS, REQUEST_TYPE_LABELS } from '@/types/ticket';

const COLORS = ['var(--color-blue)', 'var(--color-green)', 'var(--color-yellow)', 'var(--color-accent)', 'var(--color-danger)', '#8884d8', '#82ca9d'];

export default function Reports() {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<'7d' | '1m' | '3m' | 'custom'>('1m');
  const [customDates, setCustomDates] = useState({ from: '', to: '' });

  const dates = useMemo(() => {
    if (timeframe === 'custom') {
      return { from: customDates.from || undefined, to: customDates.to || undefined };
    }
    const toDate = new Date();
    const fromDate = new Date();
    if (timeframe === '7d') fromDate.setDate(fromDate.getDate() - 7);
    if (timeframe === '1m') fromDate.setMonth(fromDate.getMonth() - 1);
    if (timeframe === '3m') fromDate.setMonth(fromDate.getMonth() - 3);
    // Round to the start of the day to keep the queryKey stable
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
    return { from: fromDate.toISOString(), to: toDate.toISOString() };
  }, [timeframe, customDates.from, customDates.to]);
  const { data: overview, isLoading: overviewLoading } = useReportOverview(dates.from, dates.to);
  const { data: brands, isLoading: brandsLoading } = useHappinessIndex(dates.from, dates.to);
  const { data: developers, isLoading: devsLoading } = useDeveloperStats(dates.from, dates.to);

  if (overviewLoading || brandsLoading || devsLoading) return <PageLoader />;
  if (!overview) return null;

  const { totalTickets, totalOpen, totalInProgress, totalClosed, statusBreakdown, priorityBreakdown, requestTypeBreakdown, trend12Months } = overview;

  const reqTypeChartData = requestTypeBreakdown?.map((r: any) => ({
    name: REQUEST_TYPE_LABELS[r._id as keyof typeof REQUEST_TYPE_LABELS] || r._id,
    Count: r.count
  })).sort((a: any, b: any) => b.Count - a.Count) || [];

  const statusPieData = statusBreakdown?.map((s: any) => ({
    name: STATUS_LABELS[s._id as keyof typeof STATUS_LABELS] || s._id,
    value: s.count
  })) || [];

  const priorityPieData = priorityBreakdown?.map((p: any) => ({
    name: p._id,
    value: p.total
  })) || [];

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-[var(--color-ink)]">System Analytics</h1>
          <p className="text-[var(--color-ink-3)] text-sm mt-1">Comprehensive overview of support operations and workloads</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex bg-[var(--color-paper-2)] p-1 rounded-lg border border-[var(--color-border)]">
            {(['7d', '1m', '3m', 'custom'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeframe === tf ? 'bg-white text-[var(--color-ink)] shadow-[var(--shadow-sm)]' : 'text-[var(--color-ink-4)] hover:text-[var(--color-ink-2)]'}`}
              >
                {tf === '7d' ? '7 Days' : tf === '1m' ? '1 Month' : tf === '3m' ? '3 Months' : 'Custom'}
              </button>
            ))}
          </div>

          {timeframe === 'custom' && (
            <div className="flex items-center gap-2 bg-white border border-[var(--color-border)] rounded-lg px-2 py-1 shadow-[var(--shadow-sm)]">
              <Calendar className="w-4 h-4 text-[var(--color-ink-4)]" />
              <input type="date" value={customDates.from} onChange={e => setCustomDates(c => ({...c, from: e.target.value}))} className="text-xs bg-transparent border-none outline-none text-[var(--color-ink)]" />
              <span className="text-[var(--color-ink-4)] text-xs">-</span>
              <input type="date" value={customDates.to} onChange={e => setCustomDates(c => ({...c, to: e.target.value}))} className="text-xs bg-transparent border-none outline-none text-[var(--color-ink)]" />
            </div>
          )}

          <button onClick={() => exportReport(dates.from, dates.to)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-2)] transition-all text-sm font-medium shadow-[var(--shadow-sm)] active:scale-[0.98]">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tickets', value: totalTickets, icon: Ticket, color: 'text-[var(--color-blue)]', bg: 'bg-[var(--color-blue-light)]', desc: 'All requests logged' },
          { label: 'Open', value: totalOpen, icon: AlertTriangle, color: 'text-[var(--color-danger)]', bg: 'bg-[var(--color-danger-light)]', desc: 'Yet to be picked' },
          { label: 'In Progress', value: totalInProgress, icon: Clock, color: 'text-[var(--color-yellow)]', bg: 'bg-[var(--color-yellow-light)]', desc: 'Picked / On it / Partial' },
          { label: 'Closed', value: totalClosed, icon: CheckCircle2, color: 'text-[var(--color-green)]', bg: 'bg-[var(--color-green-light)]', desc: 'Completely closed tickets' }
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-[var(--shadow-sm)] flex items-start gap-4">
            <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color} flex-shrink-0`}>
              <kpi.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-4)] mb-1">{kpi.label}</p>
              <p className="font-serif text-3xl text-[var(--color-ink)]">{kpi.value}</p>
              <p className="text-xs text-[var(--color-ink-4)] mt-1">{kpi.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row: Status Pie, Priority Pie, Request Type Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-[var(--shadow-sm)] flex flex-col">
          <h3 className="font-serif text-lg text-[var(--color-ink)] mb-4">Tickets by Status</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} fill="#8884d8" paddingAngle={2} dataKey="value" label={({ name, percent }) => (percent ?? 0) > 0.05 ? `${name}` : ''} labelLine={false} style={{ fontSize: '10px' }}>
                  {statusPieData.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '12px', fontWeight: 500 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-[var(--shadow-sm)] flex flex-col">
          <h3 className="font-serif text-lg text-[var(--color-ink)] mb-4">Tickets by Priority</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} fill="#8884d8" paddingAngle={2} dataKey="value" label={({ name, percent }) => (percent ?? 0) > 0.05 ? `${name}` : ''} labelLine={false} style={{ fontSize: '10px' }}>
                  {priorityPieData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.name === 'P0' ? 'var(--color-danger)' : entry.name === 'P1' ? 'var(--color-accent)' : entry.name === 'P2' ? 'var(--color-yellow)' : 'var(--color-green)'} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '12px', fontWeight: 500 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-[var(--shadow-sm)] flex flex-col">
          <h3 className="font-serif text-lg text-[var(--color-ink)] mb-4">Request Type Mix</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reqTypeChartData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-ink-4)' }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-ink-2)' }} width={80} />
                <Tooltip cursor={{ fill: 'var(--color-paper-2)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '12px', fontWeight: 500 }} />
                <Bar dataKey="Count" fill="var(--color-blue)" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Brand Summary Table */}
      <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[#f4faff]">
          <h3 className="font-serif text-xl text-[#6B46C1] font-semibold mb-1">Brand Summary</h3>
          <p className="text-xs text-[var(--color-ink-4)]">A clean brand-wise view for weekly reviews and senior updates.</p>
        </div>
        <div className="p-0 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
          <table className="w-full text-left text-sm whitespace-nowrap relative">
            <thead className="bg-[#e0f7fa] text-[var(--color-ink)] text-xs font-bold sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-5 py-3">Brand</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">Open</th>
                <th className="px-5 py-3 text-right">Active</th>
                <th className="px-5 py-3 text-right">Closed</th>
                <th className="px-5 py-3 text-right">Overdue</th>
                <th className="px-5 py-3 text-right">Avg Resolution Days</th>
                <th className="px-5 py-3 text-right">Avg Difficulty</th>
                <th className="px-5 py-3 text-right">P0/P1 Active</th>
                <th className="px-5 py-3 text-right">KT Pending</th>
                <th className="px-5 py-3 text-right">Docs Attached</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {brands?.map((b: any) => (
                <tr key={b.projectId} className="hover:bg-[var(--color-paper-2)] cursor-pointer" onClick={() => navigate(`/admin/reports/company/${b.projectId}`)}>
                  <td className="px-5 py-3 font-medium text-[var(--color-ink)]">{b.projectName}</td>
                  <td className="px-5 py-3 text-right">{b.totalQueries}</td>
                  <td className="px-5 py-3 text-right">{b.openTickets}</td>
                  <td className="px-5 py-3 text-right">{b.activeTickets}</td>
                  <td className="px-5 py-3 text-right">{b.resolvedQueries}</td>
                  <td className="px-5 py-3 text-right">{b.overdue}</td>
                  <td className="px-5 py-3 text-right">{b.avgResolutionHrs ? (b.avgResolutionHrs / 24).toFixed(1) : '0.0'}</td>
                  <td className="px-5 py-3 text-right text-[var(--color-ink-4)]">0.0</td>
                  <td className="px-5 py-3 text-right">{b.p0p1Active}</td>
                  <td className="px-5 py-3 text-right text-[var(--color-ink-4)]">0</td>
                  <td className="px-5 py-3 text-right">{b.docsAttached}</td>
                </tr>
              ))}
              {(!brands || brands.length === 0) && <tr><td colSpan={11} className="px-5 py-8 text-center text-[var(--color-ink-4)] text-sm">No brand data available for this timeframe</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tables Row: Owner Workload & 12m trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Owner Workload Snapshot */}
        <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden flex flex-col h-full">
          <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-paper)]">
            <h3 className="font-serif text-lg text-[var(--color-ink)]">Owner Workload Snapshot</h3>
          </div>
          <div className="p-0 overflow-x-auto max-h-[300px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            <table className="w-full text-left text-sm whitespace-nowrap relative">
              <thead className="bg-[var(--color-paper-2)] text-[var(--color-ink-3)] text-xs font-mono uppercase sticky top-0 z-10 shadow-sm">
                <tr><th className="px-5 py-3 font-medium">Owner</th><th className="px-5 py-3 font-medium text-right">Assigned</th><th className="px-5 py-3 font-medium text-right">Active</th><th className="px-5 py-3 font-medium text-right">Closed</th><th className="px-5 py-3 font-medium text-right">Overdue</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {developers?.sort((a: any, b: any) => b.active - a.active).map((d: any) => (
                  <tr key={d.userId} className="hover:bg-[var(--color-paper-2)]">
                    <td className="px-5 py-3 font-medium text-[var(--color-ink)]">{d.name}</td>
                    <td className="px-5 py-3 text-right">{d.assigned}</td>
                    <td className="px-5 py-3 text-[var(--color-yellow)] font-medium text-right">{d.active}</td>
                    <td className="px-5 py-3 text-[var(--color-green)] font-medium text-right">{d.closed}</td>
                    <td className="px-5 py-3 text-[var(--color-danger)] font-medium text-right">{d.overdue > 0 ? d.overdue : '-'}</td>
                  </tr>
                ))}
                {(!developers || developers.length === 0) && <tr><td colSpan={5} className="px-5 py-8 text-center text-[var(--color-ink-4)] text-sm">No developer stats available for this timeframe</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* 12 Month Trend */}
        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-[var(--shadow-sm)] flex flex-col h-full">
          <h3 className="font-serif text-lg text-[var(--color-ink)] mb-4">Opened vs Closed - Last 12 Months</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend12Months} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-ink-4)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-ink-4)' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '12px', fontWeight: 500 }} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '10px', fontWeight: 500 }} />
                <Line type="monotone" dataKey="Opened" stroke="var(--color-blue)" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Closed" stroke="var(--color-green)" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
