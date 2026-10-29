import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Clock, User, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import type { Visitor } from '@flatflow/shared';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const VisitorsPage: React.FC = () => {
  const { currentFlat } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [visitorName, setVisitorName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expectedArrival, setExpectedArrival] = useState(
    new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );
  const [expectedDeparture, setExpectedDeparture] = useState(
    new Date(Date.now() + 14400000).toISOString().slice(0, 16)
  );
  const [notes, setNotes] = useState('');

  const fetchVisitors = async () => {
    if (!currentFlat) return;
    try {
      setLoading(true);
      const res = await apiClient<{ visitors: Visitor[] }>(`/api/flats/${currentFlat.id}/visitors`);
      setVisitors(res.visitors);
    } catch (err) {
      console.error('Failed to load visitors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [currentFlat?.id]);

  const handleCheckIn = async (id: string) => {
    try {
      await apiClient(`/api/visitors/${id}/checkin`, { method: 'PATCH' });
      await fetchVisitors();
    } catch (err) {
      alert('Failed to check in visitor');
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      await apiClient(`/api/visitors/${id}/checkout`, { method: 'PATCH' });
      await fetchVisitors();
    } catch (err) {
      alert('Failed to check out visitor');
    }
  };

  const handleAddVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient(`/api/flats/${currentFlat!.id}/visitors`, {
        method: 'POST',
        body: JSON.stringify({
          visitorName,
          purpose,
          expectedArrival: new Date(expectedArrival).toISOString(),
          expectedDeparture: new Date(expectedDeparture).toISOString(),
          notes: notes || undefined,
        }),
      });

      setVisitorName('');
      setPurpose('');
      setNotes('');
      setIsModalOpen(false);
      await fetchVisitors();
    } catch (err) {
      alert('Failed to register visitor');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Visitor Management</h1>
            <Badge variant="purple" size="sm">
              Privacy-Scoped
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Let flatmates know about upcoming guests, overnight stays, and technician visits.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Register Upcoming Guest
        </button>
      </div>

      {/* Visitor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visitors.map((v) => {
          const isCheckedIn = v.checkedInAt && !v.checkedOutAt;
          const isCompleted = Boolean(v.checkedOutAt);

          return (
            <div
              key={v.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{v.visitorName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{v.purpose}</p>
                  </div>
                  <Badge
                    variant={isCheckedIn ? 'success' : isCompleted ? 'slate' : 'purple'}
                    size="sm"
                  >
                    {isCheckedIn ? 'Checked In' : isCompleted ? 'Departed' : 'Upcoming'}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs text-slate-600 my-4 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-slate-500">Host Roommate:</span>
                    <strong className="text-slate-900">{v.host?.fullName || 'Roommate'}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-cyan-600" />
                    <span className="text-slate-500">ETA:</span>
                    <span className="font-medium text-slate-700">
                      {new Date(v.expectedArrival).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {v.notes && (
                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/80">
                      Notes: {v.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {!isCheckedIn && !isCompleted && (
                  <button
                    onClick={() => handleCheckIn(v.id)}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-indigo-600/15"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Check In Guest</span>
                  </button>
                )}

                {isCheckedIn && (
                  <button
                    onClick={() => handleCheckOut(v.id)}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-amber-500/15"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Check Out</span>
                  </button>
                )}

                {isCompleted && (
                  <span className="text-[11px] text-slate-500 font-medium">Visit completed &amp; logged</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Visitor"
        subtitle="Keep flatmates notified of visiting friends, family, or technicians"
      >
        <form onSubmit={handleAddVisitor} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Visitor / Guest Name
            </label>
            <input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Purpose of Visit</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Weekend stay or College project discussion"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expected Arrival</label>
              <input
                type="datetime-local"
                value={expectedArrival}
                onChange={(e) => setExpectedArrival(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expected Departure</label>
              <input
                type="datetime-local"
                value={expectedDeparture}
                onChange={(e) => setExpectedDeparture(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Will be in common room until evening, no parking spot required."
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-colors"
            />
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
              Register Guest
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
