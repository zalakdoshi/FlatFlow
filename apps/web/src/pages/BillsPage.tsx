import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Clock,
  CheckCircle2,
  Zap,
  Wifi,
  Droplets,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import {
  formatPaise,
  currencyToPaise,
  type Bill,
  type BillCategory,
  BILL_CATEGORIES,
} from '@flatflow/shared';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const BillsPage: React.FC = () => {
  const { currentFlat, profile } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);

  // Add bill form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BillCategory>('electricity');
  const [amountRupees, setAmountRupees] = useState('');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [billingPeriod, setBillingPeriod] = useState('March 2026');
  const [members, setMembers] = useState<Array<{ userId: string; fullName: string }>>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchBills = async () => {
    if (!currentFlat) return;
    try {
      setLoading(true);
      const res = await apiClient<{ bills: Bill[] }>(`/api/flats/${currentFlat.id}/bills`);
      setBills(res.bills);

      const flatRes = await apiClient<{ members: Array<{ userId: string; profile?: { fullName: string } }> }>(
        `/api/flats/${currentFlat.id}`
      );
      const mList = flatRes.members.map((m) => ({
        userId: m.userId,
        fullName: m.profile?.fullName ?? 'Roommate',
      }));
      setMembers(mList);
      if (selectedMemberIds.length === 0) {
        setSelectedMemberIds(mList.map((m) => m.userId));
      }
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [currentFlat?.id]);

  const handlePayShare = async (billId: string) => {
    try {
      setPayingBillId(billId);
      await apiClient(`/api/bills/${billId}/pay`, { method: 'PATCH' });
      await fetchBills();
    } catch (err) {
      alert('Failed to pay bill share');
    } finally {
      setPayingBillId(null);
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amountPaise = currencyToPaise(Number(amountRupees) || 0);

    if (amountPaise <= 0) {
      setFormError('Amount must be greater than zero');
      return;
    }

    try {
      await apiClient(`/api/flats/${currentFlat!.id}/bills`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          category,
          totalAmountPaise: amountPaise,
          dueDate,
          billingPeriod,
          memberIds: selectedMemberIds,
        }),
      });
      setIsModalOpen(false);
      setTitle('');
      setAmountRupees('');
      await fetchBills();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create bill');
    }
  };

  const getCategoryIcon = (cat: BillCategory) => {
    switch (cat) {
      case 'electricity':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'wifi':
        return <Wifi className="w-5 h-5 text-cyan-600" />;
      case 'water':
        return <Droplets className="w-5 h-5 text-blue-600" />;
      case 'gas':
        return <Flame className="w-5 h-5 text-rose-500" />;
      default:
        return <CreditCard className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Bills &amp; Rent Tracking</h1>
            <Badge variant="purple" size="sm">
              Recurring &amp; Due Alerts
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Track rent, Bescom electricity, Wi-Fi, and utility deadlines with roommate contribution progress.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Household Bill
        </button>
      </div>

      {/* Bills Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bills.map((bill) => {
          const paidShares = bill.shares.filter((s) => s.status === 'paid').length;
          const totalShares = bill.shares.length;
          const percentPaid = totalShares > 0 ? Math.round((paidShares / totalShares) * 100) : 0;
          const userShare = bill.shares.find((s) => s.userId === profile?.id);
          const hasUserPaid = userShare?.status === 'paid';

          return (
            <div
              key={bill.id}
              className="rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                      {getCategoryIcon(bill.category)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{bill.title}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">{bill.billingPeriod}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      bill.status === 'paid'
                        ? 'success'
                        : bill.status === 'partially_paid'
                        ? 'warning'
                        : 'slate'
                    }
                    size="sm"
                  >
                    {bill.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="my-4">
                  <span className="text-2xl font-black text-slate-900">
                    {formatPaise(bill.totalAmountPaise, currentFlat?.currency)}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Split among {totalShares} flatmates ({formatPaise(userShare?.sharePaise || 0, currentFlat?.currency)}/ea)
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>Contribution Progress</span>
                    <span className="text-slate-900 font-bold">
                      {paidShares}/{totalShares} Paid ({percentPaid}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${percentPaid}%` }}
                    />
                  </div>
                </div>

                {/* Roommate Shares list */}
                <div className="space-y-1.5 mb-5">
                  {bill.shares.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 font-medium"
                    >
                      <span className="text-slate-700">{s.user?.fullName || 'Roommate'}</span>
                      {s.status === 'paid' ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold">Pending</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Due {bill.dueDate}</span>
                </div>

                {userShare && !hasUserPaid && (
                  <button
                    onClick={() => handlePayShare(bill.id)}
                    disabled={payingBillId === bill.id}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    {payingBillId === bill.id ? 'Processing...' : 'Pay My Share'}
                  </button>
                )}

                {hasUserPaid && (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Your Share Paid
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Bill Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Household Bill"
        subtitle="Schedule a recurring or one-time utility/rent bill"
      >
        <form onSubmit={handleCreateBill} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Bill Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bescom Electricity Bill"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BillCategory)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:border-indigo-500 outline-none"
              >
                {BILL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total (INR ₹)</label>
              <input
                type="number"
                step="0.01"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                placeholder="e.g. 3500"
                required
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 outline-none font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Billing Period</label>
              <input
                type="text"
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
                placeholder="e.g. March 2026"
                required
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm cursor-pointer"
            >
              Create Bill
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
