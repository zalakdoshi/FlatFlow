import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import {
  formatPaise,
  currencyToPaise,
  calculateEqualSplits,
  validateSplitReconciliation,
  type Expense,
  type ExpenseCategory,
  type SplitType,
  EXPENSE_CATEGORIES,
} from '@flatflow/shared';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const ExpensesPage: React.FC<{ isOpenAddModal?: boolean; onCloseAddModal?: () => void }> = ({
  isOpenAddModal = false,
  onCloseAddModal,
}) => {
  const { currentFlat, profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(isOpenAddModal);

  // Add Expense form state
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('groceries');
  const [amountRupees, setAmountRupees] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [payerId, setPayerId] = useState<string>('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [members, setMembers] = useState<Array<{ userId: string; fullName: string }>>([]);

  const fetchExpenses = async () => {
    if (!currentFlat) return;
    try {
      setLoading(true);
      const res = await apiClient<{ expenses: Expense[] }>(`/api/flats/${currentFlat.id}/expenses`);
      setExpenses(res.expenses);

      // Fetch flat members
      const flatRes = await apiClient<{ members: Array<{ userId: string; profile?: { fullName: string } }> }>(
        `/api/flats/${currentFlat.id}`
      );
      const mList = flatRes.members.map((m) => ({
        userId: m.userId,
        fullName: m.profile?.fullName ?? 'Roommate',
      }));
      setMembers(mList);
      if (mList.length > 0 && !payerId) {
        setPayerId(profile?.id || mList[0]!.userId);
        setSelectedMemberIds(mList.map((m) => m.userId));
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [currentFlat?.id]);

  useEffect(() => {
    if (isOpenAddModal) setIsModalOpen(true);
  }, [isOpenAddModal]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onCloseAddModal) onCloseAddModal();
    setFormError(null);
  };

  const handleToggleMember = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      if (selectedMemberIds.length === 1) return; // At least one
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const totalPaise = currencyToPaise(Number(amountRupees) || 0);

  // Compute splits based on selected type
  let computedSplits: Array<{ userId: string; sharePaise: number }> = [];
  if (splitType === 'equal') {
    computedSplits = calculateEqualSplits(totalPaise, selectedMemberIds);
  } else if (splitType === 'exact') {
    computedSplits = selectedMemberIds.map((uid) => ({
      userId: uid,
      sharePaise: currencyToPaise(Number(customShares[uid]) || 0),
    }));
  }

  const reconciliation = validateSplitReconciliation(totalPaise, computedSplits);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (totalPaise <= 0) {
      setFormError('Amount must be greater than 0');
      return;
    }

    if (!description.trim()) {
      setFormError('Please provide a description');
      return;
    }

    if (selectedMemberIds.length === 0) {
      setFormError('Please select at least one roommate to split with');
      return;
    }

    if (!reconciliation.valid && splitType === 'exact') {
      setFormError(
        `Splits do not equal total amount! Difference: ₹${(reconciliation.differencePaise / 100).toFixed(2)}`
      );
      return;
    }

    try {
      setSubmitting(true);
      await apiClient(`/api/flats/${currentFlat!.id}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          description,
          category,
          amountPaise: totalPaise,
          expenseDate,
          payerId,
          splitType,
          splits: computedSplits,
        }),
      });

      // Reset form
      setDescription('');
      setAmountRupees('');
      handleCloseModal();
      await fetchExpenses();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shared expense?')) return;
    try {
      await apiClient(`/api/expenses/${id}`, { method: 'DELETE' });
      await fetchExpenses();
    } catch (err) {
      alert('Failed to delete expense');
    }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['Description', 'Category', 'Amount (INR)', 'Payer', 'Date'];
    const rows = expenses.map((e) => [
      `"${e.description.replace(/"/g, '""')}"`,
      e.category,
      (e.amountPaise / 100).toFixed(2),
      `"${e.payer?.fullName || 'Roommate'}"`,
      e.expenseDate,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FlatFlow-Expenses-${currentFlat?.name || 'Flat'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.payer?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'all' || e.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Expenses & Splits</h1>
            <Badge variant="purple" size="sm">
              Paise-Accurate
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Log shared costs, split equally or by custom shares, and track repayments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl p-4 bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search expenses or payers..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:border-indigo-500 outline-none"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Description</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Payer</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Splits</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <span>{exp.description}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="purple" size="sm">
                        {exp.category.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-700">
                      {exp.payer?.fullName || 'Roommate'}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-medium">{exp.expenseDate}</td>
                    <td className="py-4 px-6 font-extrabold text-slate-900 text-sm">
                      {formatPaise(exp.amountPaise, currentFlat?.currency)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {exp.splits.length} flatmates &bull;{' '}
                        {formatPaise(exp.splits[0]?.sharePaise || 0, currentFlat?.currency)}/ea
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No expenses found. Click &quot;Add Expense&quot; above to log the first shared cost.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal with Split Editor */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Add Shared Expense"
        subtitle="Record money spent for the flat and split with roommates"
        maxWidth="xl"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Weekly Organic Veggies"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Amount (INR ₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                placeholder="e.g. 1200"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:border-indigo-500 outline-none"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Paid By</label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-indigo-700 focus:border-indigo-500 outline-none"
              >
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Split Mode Selector */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">Split Method</label>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSplitType('equal')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    splitType === 'equal'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Split Equally
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('exact')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    splitType === 'exact'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Custom Exact
                </button>
              </div>
            </div>

            {/* Split Participants Checklist */}
            <div className="space-y-2 mt-3">
              <p className="text-[11px] text-slate-500 font-medium">Select participants sharing this expense:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {members.map((m) => {
                  const isChecked = selectedMemberIds.includes(m.userId);
                  const share = computedSplits.find((s) => s.userId === m.userId)?.sharePaise || 0;

                  return (
                    <div
                      key={m.userId}
                      onClick={() => handleToggleMember(m.userId)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-50/70 border-indigo-200 text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isChecked && '✓'}
                        </div>
                        <span className="text-xs font-semibold">{m.fullName}</span>
                      </div>

                      {splitType === 'equal' && isChecked && (
                        <span className="text-xs font-bold text-indigo-700">
                          {formatPaise(share, currentFlat?.currency)}
                        </span>
                      )}

                      {splitType === 'exact' && isChecked && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1"
                        >
                          <span className="text-xs text-slate-400">₹</span>
                          <input
                            type="number"
                            value={customShares[m.userId] || ''}
                            onChange={(e) =>
                              setCustomShares({ ...customShares, [m.userId]: e.target.value })
                            }
                            placeholder="0"
                            className="w-20 px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 text-right font-bold"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Split Reconciliation Status */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                Sum of Shares:{' '}
                <strong className="text-slate-900">
                  ₹{(computedSplits.reduce((acc, s) => acc + s.sharePaise, 0) / 100).toFixed(2)}
                </strong>
              </span>
              {reconciliation.valid ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% Reconciled
                </span>
              ) : (
                <span className="text-amber-700 font-bold">
                  Diff: ₹{(reconciliation.differencePaise / 100).toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save & Split Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
