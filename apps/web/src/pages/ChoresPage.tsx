import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckSquare,
  Plus,
  RotateCw,
  Sparkles,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import type { Chore, ChoreFairnessScore, ChorePriority, ChoreRecurrence } from '@flatflow/shared';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const ChoresPage: React.FC = () => {
  const { currentFlat } = useAuth();
  const [chores, setChores] = useState<Chore[]>([]);
  const [fairnessScores, setFairnessScores] = useState<ChoreFairnessScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rotatingChoreId, setRotatingChoreId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [dueAt, setDueAt] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [priority, setPriority] = useState<ChorePriority>('medium');
  const [recurrenceRule, setRecurrenceRule] = useState<ChoreRecurrence>('weekly');
  const [members, setMembers] = useState<Array<{ userId: string; fullName: string }>>([]);

  const fetchChores = async () => {
    if (!currentFlat) return;
    try {
      setLoading(true);
      const res = await apiClient<{
        chores: Chore[];
        fairnessScores: ChoreFairnessScore[];
      }>(`/api/flats/${currentFlat.id}/chores`);
      setChores(res.chores);
      setFairnessScores(res.fairnessScores);

      const flatRes = await apiClient<{ members: Array<{ userId: string; profile?: { fullName: string } }> }>(
        `/api/flats/${currentFlat.id}`
      );
      const mList = flatRes.members.map((m) => ({
        userId: m.userId,
        fullName: m.profile?.fullName ?? 'Roommate',
      }));
      setMembers(mList);
      if (mList.length > 0 && !assignedTo) {
        setAssignedTo(mList[0]!.userId);
      }
    } catch (err) {
      console.error('Failed to load chores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChores();
  }, [currentFlat?.id]);

  const handleCompleteChore = async (choreId: string) => {
    try {
      await apiClient(`/api/chores/${choreId}/complete`, { method: 'POST' });
      // Trigger Confetti Celebration!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#10b981', '#06b6d4'],
      });
      await fetchChores();
    } catch (err) {
      alert('Failed to complete chore');
    }
  };

  const handleAutoRotate = async (choreId: string) => {
    try {
      setRotatingChoreId(choreId);
      await apiClient(`/api/flats/${currentFlat!.id}/chores/rotate`, {
        method: 'POST',
        body: JSON.stringify({ choreId }),
      });
      await fetchChores();
    } catch (err) {
      alert('Failed to rotate chore');
    } finally {
      setRotatingChoreId(null);
    }
  };

  const handleCreateChore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient(`/api/flats/${currentFlat!.id}/chores`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: description || undefined,
          assignedTo: assignedTo || undefined,
          dueAt: new Date(dueAt).toISOString(),
          priority,
          recurrenceRule,
        }),
      });

      setTitle('');
      setDescription('');
      setIsModalOpen(false);
      await fetchChores();
    } catch (err) {
      alert('Failed to create chore');
    }
  };

  const activeChores = chores.filter((c) => c.status !== 'completed');
  const completedChores = chores.filter((c) => c.status === 'completed');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Chores Scheduler</h1>
            <Badge variant="purple" size="sm">
              Fairness Engine Active
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Rotate weekly chores automatically and ensure household responsibilities stay balanced.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Assign New Chore
        </button>
      </div>

      {/* Fairness Meter Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900">Chore Fairness & Effort Tracker</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {fairnessScores.map((score) => (
            <div
              key={score.userId}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">{score.userName}</span>
                  <Badge
                    variant={
                      score.fairnessRating === 'balanced'
                        ? 'success'
                        : score.fairnessRating === 'above_average'
                        ? 'purple'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {score.fairnessRating.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500">
                  {score.completedCount} of {score.assignedCount} tasks finished
                </p>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Completion Rate</span>
                  <span className="font-semibold text-slate-900">{score.completionRatePercent}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${score.completionRatePercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Chores List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-cyan-600" /> Active Household Tasks ({activeChores.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeChores.map((chore) => {
            const isRotating = rotatingChoreId === chore.id;
            return (
              <div
                key={chore.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{chore.title}</h3>
                    <Badge
                      variant={
                        chore.priority === 'urgent'
                          ? 'danger'
                          : chore.priority === 'high'
                          ? 'warning'
                          : 'slate'
                      }
                      size="sm"
                    >
                      {chore.priority.toUpperCase()}
                    </Badge>
                  </div>

                  {chore.description && (
                    <p className="text-xs text-slate-600 mb-4 line-clamp-2">{chore.description}</p>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-slate-500">Assigned:</span>
                      <strong className="text-slate-900">
                        {chore.assignee?.fullName || 'Unassigned'}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-slate-500">Due:</span>
                      <span className="font-medium text-slate-700">{new Date(chore.dueAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {chore.recurrenceRule !== 'none' && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <RotateCw className="w-3 h-3 text-cyan-600" />
                        <span>Repeats: {chore.recurrenceRule}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleAutoRotate(chore.id)}
                    disabled={isRotating}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Auto-rotate task to the fairest next roommate"
                  >
                    <RotateCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} />
                    <span>Rotate</span>
                  </button>

                  <button
                    onClick={() => handleCompleteChore(chore.id)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/15 cursor-pointer transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed Chores Section */}
      {completedChores.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Recently Completed Chores</h3>
          <div className="space-y-2">
            {completedChores.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="line-through text-slate-500 font-medium">{c.title}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Completed {new Date(c.completedAt || c.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Chore Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign Household Chore"
        subtitle="Schedule a recurring task for cleaning, cooking, or waste management"
      >
        <form onSubmit={handleCreateChore} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Chore Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep Clean Kitchen Counters"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Instructions (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Wipe gas stove, empty sink strainer, and wipe microwave interior."
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assignee</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-colors"
              >
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ChorePriority)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-colors"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Due Date & Time</label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Recurrence</label>
              <select
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value as ChoreRecurrence)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-colors"
              >
                <option value="none">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
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
              Assign Chore
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
