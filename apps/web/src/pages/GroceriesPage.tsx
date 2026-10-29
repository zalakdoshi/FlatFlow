import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Tag,
  DollarSign,
  User,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import {
  formatPaise,
  currencyToPaise,
  type GroceryItem,
  type GroceryList,
} from '@flatflow/shared';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const GroceriesPage: React.FC = () => {
  const { currentFlat } = useAuth();
  const [list, setList] = useState<GroceryList | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('units');
  const [estimatedRupees, setEstimatedRupees] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [members, setMembers] = useState<Array<{ userId: string; fullName: string }>>([]);

  const fetchGroceries = async () => {
    if (!currentFlat) return;
    try {
      setLoading(true);
      const res = await apiClient<{ list: GroceryList; items: GroceryItem[] }>(
        `/api/flats/${currentFlat.id}/grocery-items`
      );
      setList(res.list);
      setItems(res.items);

      const flatRes = await apiClient<{ members: Array<{ userId: string; profile?: { fullName: string } }> }>(
        `/api/flats/${currentFlat.id}`
      );
      setMembers(
        flatRes.members.map((m) => ({
          userId: m.userId,
          fullName: m.profile?.fullName ?? 'Roommate',
        }))
      );
    } catch (err) {
      console.error('Failed to load grocery items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroceries();
  }, [currentFlat?.id]);

  const handleTogglePurchased = async (item: GroceryItem) => {
    try {
      const nextPurchased = !item.isPurchased;
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isPurchased: nextPurchased, purchasedAt: nextPurchased ? new Date().toISOString() : null } : i
        )
      );
      await apiClient(`/api/grocery-items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPurchased: nextPurchased }),
      });
    } catch (err) {
      fetchGroceries();
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      setItems((prev) => prev.filter((i) => i.id !== id));
      await apiClient(`/api/grocery-items/${id}`, { method: 'DELETE' });
    } catch (err) {
      fetchGroceries();
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const estimatedPaise = currencyToPaise(Number(estimatedRupees) || 0);
    try {
      await apiClient(`/api/flats/${currentFlat!.id}/grocery-items`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          quantity,
          unit,
          estimatedPricePaise: estimatedPaise,
          assignedTo: assignedTo || undefined,
        }),
      });

      setName('');
      setEstimatedRupees('');
      setIsModalOpen(false);
      await fetchGroceries();
    } catch (err) {
      alert('Failed to add grocery item');
    }
  };

  const pendingItems = items.filter((i) => !i.isPurchased);
  const purchasedItems = items.filter((i) => i.isPurchased);

  const totalEstimatedPaise = items.reduce((acc, i) => acc + (i.estimatedPricePaise || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Shared Grocery List</h1>
            <Badge variant="purple" size="sm">
              Live Collaborative
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Realtime checklist. When a flatmate marks milk purchased, it checks off instantly for everyone.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700">
            <span>Est. Total:</span>
            <strong className="text-emerald-600 font-bold">
              {formatPaise(totalEstimatedPaise, currentFlat?.currency)}
            </strong>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Grocery Item
          </button>
        </div>
      </div>

      {/* Main Checklist Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            To Buy ({pendingItems.length})
          </h2>

          <div className="space-y-2.5">
            {pendingItems.length > 0 ? (
              pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between hover:border-indigo-300 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleTogglePurchased(item)}
                      className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 cursor-pointer transition-colors"
                    >
                      <Circle className="w-5 h-5" />
                    </button>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-medium">
                        <span>
                          {item.quantity} {item.unit}
                        </span>
                        {item.assignedUser && (
                          <span className="text-indigo-600 font-semibold">
                            &bull; Assigned to {item.assignedUser.fullName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {item.estimatedPricePaise > 0 && (
                      <span className="text-xs font-bold text-slate-700">
                        ~{formatPaise(item.estimatedPricePaise, currentFlat?.currency)}
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">
                All grocery items purchased! The fridge is fully stocked.
              </div>
            )}
          </div>
        </div>

        {/* Purchased Items */}
        {purchasedItems.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Purchased ({purchasedItems.length})
            </h2>

            <div className="space-y-2">
              {purchasedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50/60 border border-slate-200/60 flex items-center justify-between opacity-75 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleTogglePurchased(item)}
                      className="p-1 text-emerald-600 cursor-pointer"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 line-through">
                        {item.name}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Grocery Item"
        subtitle="Item will be instantly visible to all roommates"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Item Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sourdough Bread or Greek Yogurt"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="packets, kg, bottles"
                required
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estimated Price (₹ INR)
              </label>
              <input
                type="number"
                value={estimatedRupees}
                onChange={(e) => setEstimatedRupees(e.target.value)}
                placeholder="e.g. 180"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assign Buyer (Optional)
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-colors"
              >
                <option value="">Anyone</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-colors shadow-md shadow-indigo-600/20"
            >
              Add to Shared List
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
