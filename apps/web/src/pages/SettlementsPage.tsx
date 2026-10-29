import React, { useState, useEffect } from 'react';
import {
  Scale,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  History,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import {
  formatPaise,
  type MemberBalance,
  type SuggestedSettlement,
  type Settlement,
} from '@flatflow/shared';
import { Badge } from '../components/common/Badge';

export const SettlementsPage: React.FC = () => {
  const { currentFlat } = useAuth();
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedSettlement[]>([]);
  const [history, setHistory] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState<string | null>(null);

  const fetchSettlements = async () => {
    if (!currentFlat) return;
    try {
      setLoading(true);
      const res = await apiClient<{
        balances: MemberBalance[];
        suggestedSettlements: SuggestedSettlement[];
        settlementHistory: Settlement[];
      }>(`/api/flats/${currentFlat.id}/settlements`);

      setBalances(res.balances);
      setSuggestions(res.suggestedSettlements);
      setHistory(res.settlementHistory);
    } catch (err) {
      console.error('Failed to load settlements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [currentFlat?.id]);

  const handleExecuteSettlement = async (s: SuggestedSettlement) => {
    const key = `${s.fromUserId}-${s.toUserId}`;
    try {
      setSettling(key);
      await apiClient(`/api/flats/${currentFlat!.id}/settlements`, {
        method: 'POST',
        body: JSON.stringify({
          payerId: s.fromUserId,
          receiverId: s.toUserId,
          amountPaise: s.amountPaise,
        }),
      });
      await fetchSettlements();
    } catch (err) {
      alert('Failed to record settlement');
    } finally {
      setSettling(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Settlements &amp; Net Balances
          </h1>
          <Badge variant="purple" size="sm">
            Greedy Min-Cash-Flow
          </Badge>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          The Smart Settlement Optimizer minimizes total transactions so flatmates settle up with
          the fewest payments.
        </p>
      </div>

      {/* Smart Settlement Optimizer Card */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/90 relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Suggested Repayments</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Direct settlement route calculated from all active expense splits and previous payments.
            </p>
          </div>
          <Badge variant="success" size="md">
            Optimal Debt Minimization
          </Badge>
        </div>

        <div className="mt-6 space-y-3">
          {suggestions.length > 0 ? (
            suggestions.map((s, idx) => {
              const isProcessing = settling === `${s.fromUserId}-${s.toUserId}`;
              const fromDisplayName = s.fromName || (s as any).fromUser?.fullName || 'Roommate';
              const toDisplayName = s.toName || (s as any).toUser?.fullName || 'Roommate';
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-sm">
                      {fromDisplayName.charAt(0) || 'R'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <span>{fromDisplayName}</span>
                        <ArrowRight className="w-4 h-4 text-indigo-600" />
                        <span className="text-emerald-700">{toDisplayName}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">Direct suggested transfer</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-lg font-extrabold text-slate-900">
                      {formatPaise(s.amountPaise, currentFlat?.currency)}
                    </span>
                    <button
                      onClick={() => handleExecuteSettlement(s)}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                    >
                      {isProcessing ? (
                        'Recording...'
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Record Payment</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <p className="font-bold text-slate-900">Everyone is fully settled up!</p>
              <p className="text-[11px] text-slate-500">No pending balances in this flat.</p>
            </div>
          )}
        </div>
      </div>

      {/* Member Balances Breakdown Table */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">Flatmate Balances Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Flatmate</th>
                <th className="py-3 px-4">Total Paid (Credits)</th>
                <th className="py-3 px-4">Total Consumed (Debits)</th>
                <th className="py-3 px-4">Net Balance</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {balances.map((b) => {
                const displayName = b.userName || (b as any).user?.fullName || 'Roommate';
                return (
                  <tr key={b.userId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200">
                        {displayName.charAt(0) || 'R'}
                      </div>
                      <span>{displayName}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {formatPaise(b.totalPaidPaise, currentFlat?.currency)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {formatPaise(b.totalOwedPaise, currentFlat?.currency)}
                    </td>
                  <td className="py-3.5 px-4 font-extrabold text-sm">
                    <span
                      className={
                        b.netBalancePaise > 0
                          ? 'text-emerald-700'
                          : b.netBalancePaise < 0
                          ? 'text-rose-700'
                          : 'text-slate-500'
                      }
                    >
                      {b.netBalancePaise > 0 ? '+' : ''}
                      {formatPaise(b.netBalancePaise, currentFlat?.currency)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {b.netBalancePaise > 0 && <Badge variant="success" size="sm">Gets back</Badge>}
                    {b.netBalancePaise < 0 && <Badge variant="danger" size="sm">Owes money</Badge>}
                    {b.netBalancePaise === 0 && <Badge variant="slate" size="sm">Settled</Badge>}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settlement History */}
      {history.length > 0 && (
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-base font-bold text-slate-900">Settlement History</h3>
          </div>
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 font-medium">
                  <span className="font-bold text-slate-900">{h.payer?.fullName || 'Roommate'}</span>
                  <span className="text-slate-400">paid</span>
                  <span className="font-bold text-emerald-700">
                    {h.receiver?.fullName || 'Roommate'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-slate-900">
                    {formatPaise(h.amountPaise, currentFlat?.currency)}
                  </span>
                  <Badge variant="success" size="sm">
                    Completed
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
