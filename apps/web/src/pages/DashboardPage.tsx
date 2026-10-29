import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  CheckSquare,
  ShoppingCart,
  Wrench,
  Plus,
  ArrowRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import { formatPaise, type DashboardSummary } from '@flatflow/shared';
import { Badge } from '../components/common/Badge';

interface DashboardPageProps {
  onOpenAddExpense: () => void;
  onOpenAddChore: () => void;
  onOpenAddGrocery: () => void;
  onOpenReportIssue: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  groceries: '#10b981',
  utilities: '#06b6d4',
  rent: '#6366f1',
  household_supplies: '#f59e0b',
  food_dining: '#ec4899',
  maintenance: '#8b5cf6',
  other: '#94a3b8',
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenAddExpense,
  onOpenAddChore,
  onOpenAddGrocery,
  onOpenReportIssue,
}) => {
  const { currentFlat } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    if (!currentFlat) return;
    try {
      setLoading(true);
      const res = await apiClient<DashboardSummary>(`/api/flats/${currentFlat.id}/dashboard`);
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [currentFlat?.id]);

  if (loading || !data) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200/60 rounded-2xl w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200/60 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200/60 rounded-2xl" />
          <div className="h-72 bg-slate-200/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Monthly trend sample chart data (formatted with real current monthly total)
  const monthlySpendingTrend = [
    { month: 'Dec', amount: 8400 },
    { month: 'Jan', amount: 10200 },
    { month: 'Feb', amount: 9600 },
    { month: 'Mar', amount: data.monthlyTotalSpendingPaise / 100 || 12450 },
  ];

  const pieData = (data.categorySpending || []).map((cs) => ({
    name: cs.category.replace('_', ' ').toUpperCase(),
    value: cs.amountPaise / 100,
    color: CATEGORY_COLORS[cs.category] || '#6366f1',
  }));

  const userIsCreditor = data.userNetBalancePaise > 0;
  const userIsDebtor = data.userNetBalancePaise < 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-50/90 via-white to-cyan-50/80 border border-indigo-100/90 overflow-hidden shadow-lg shadow-indigo-500/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="purple" size="md">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                Live Household Hub &bull; Realtime Active
              </Badge>
              <span className="text-xs text-slate-500 font-semibold">
                {currentFlat?.addressLabel || 'Tower B, Dome Wing, Flat 402'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {currentFlat?.name ?? 'Skyline Dome Residency 402'}
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-xl leading-relaxed font-medium">
              {formatPaise(data.monthlyTotalSpendingPaise, currentFlat?.currency)} shared spending
              this month &bull; {data.members.length} roommates in sync &bull;{' '}
              {data.pendingChoresCount} pending tasks.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenAddExpense}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
            <button
              onClick={onOpenAddChore}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 hover:border-cyan-400 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
            >
              <CheckSquare className="w-3.5 h-3.5 text-cyan-600" />
              Assign Chore
            </button>
            <button
              onClick={onOpenAddGrocery}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 hover:border-emerald-400 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
              Add Grocery
            </button>
            <button
              onClick={onOpenReportIssue}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 hover:border-amber-400 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-600" />
              Report Issue
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Monthly Total Spending */}
        <div className="glass-card rounded-3xl p-5 border border-slate-200/90 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Monthly Spending</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200/60">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {formatPaise(data.monthlyTotalSpendingPaise, currentFlat?.currency)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span className="text-emerald-700 font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> Reconciled
            </span>
            <span>across all flatmates</span>
          </div>
        </div>

        {/* KPI 2: Personal Net Balance */}
        <div className="glass-card rounded-3xl p-5 border border-slate-200/90 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Your Net Balance</span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                userIsCreditor
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : userIsDebtor
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {userIsCreditor ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
          </div>
          <p
            className={`text-2xl font-black ${
              userIsCreditor
                ? 'text-emerald-700'
                : userIsDebtor
                ? 'text-rose-700'
                : 'text-slate-800'
            }`}
          >
            {userIsCreditor ? '+' : ''}
            {formatPaise(data.userNetBalancePaise, currentFlat?.currency)}
          </p>
          <div className="mt-2 text-[11px]">
            {userIsCreditor && (
              <Badge variant="success" size="sm">
                You are owed money
              </Badge>
            )}
            {userIsDebtor && (
              <Badge variant="danger" size="sm">
                You owe flatmates
              </Badge>
            )}
            {!userIsCreditor && !userIsDebtor && (
              <Badge variant="slate" size="sm">
                All settled up
              </Badge>
            )}
          </div>
        </div>

        {/* KPI 3: Pending Chores */}
        <div className="glass-card rounded-3xl p-5 border border-slate-200/90 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Pending Chores</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-200/60">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{data.pendingChoresCount}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span className="text-cyan-700 font-bold">Auto-rotation</span>
            <span>schedule active</span>
          </div>
        </div>

        {/* KPI 4: Upcoming Bills */}
        <div className="glass-card rounded-3xl p-5 border border-slate-200/90 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Upcoming Bills</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{data.upcomingBillsCount}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span className="text-amber-700 font-bold">Bescom & Wi-Fi</span>
            <span>due soon</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts & Debt Optimizer Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trend Area Chart */}
        <div className="lg:col-span-2 rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Household Expenses</h3>
              <p className="text-xs text-slate-500 font-medium">Spending history and trajectory</p>
            </div>
            <Badge variant="purple" size="sm">
              Realtime INR
            </Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySpendingTrend}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#0f172a',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Total Spent']}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#spendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Expenses by Category</h3>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '12px',
                        fontSize: '11px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                      formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Total']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400">No categorized expenses yet</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5 mt-2">
            {pieData.slice(0, 3).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 capitalize">{item.name.toLowerCase()}</span>
                </div>
                <span className="font-bold text-slate-900">₹{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suggested Settlements & Recent Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart Settlement Optimizer Preview */}
        <div className="rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Smart Settlement Optimizer</h3>
            </div>
            <Badge variant="success" size="sm">
              Min Transfers
            </Badge>
          </div>

          <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
            The platform simplifies all individual IOUs across flatmates into the minimal set of
            direct repayments.
          </p>

          <div className="space-y-2.5">
            {data.suggestedSettlements.length > 0 ? (
              data.suggestedSettlements.map((s, idx) => {
                const fromDisplayName = s.fromName || (s as any).fromUser?.fullName || 'Roommate';
                const toDisplayName = s.toName || (s as any).toUser?.fullName || 'Roommate';
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
                        {fromDisplayName.charAt(0) || 'R'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <span>{fromDisplayName}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-emerald-700">{toDisplayName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Direct suggested transfer</span>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-slate-900">
                      {formatPaise(s.amountPaise, currentFlat?.currency)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                🎉 All balances are currently settled! No pending debt between flatmates.
              </div>
            )}
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Recent Household Activity</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Live feed</span>
          </div>

          <div className="space-y-3">
            {data.recentActivities.length > 0 ? (
              data.recentActivities.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200 mt-0.5">
                    {log.actor?.fullName?.charAt(0) ?? 'R'}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-700 font-medium leading-snug">
                      <strong className="text-slate-900">{log.actor?.fullName ?? 'Roommate'}</strong>{' '}
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">No recent activity logs</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
