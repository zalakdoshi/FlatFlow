import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageSquare,
  MapPin,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import type {
  MaintenanceRequest,
  MaintenancePriority,
  MaintenanceStatus,
} from '@flatflow/shared';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const MaintenancePage: React.FC = () => {
  const { currentFlat, profile } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [newComment, setNewComment] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Kitchen');
  const [priority, setPriority] = useState<MaintenancePriority>('medium');

  const fetchMaintenance = async () => {
    if (!currentFlat) return;
    try {
      setLoading(true);
      const res = await apiClient<{ requests: MaintenanceRequest[] }>(
        `/api/flats/${currentFlat.id}/maintenance`
      );
      setRequests(res.requests);
      if (selectedRequest) {
        const updated = res.requests.find((r) => r.id === selectedRequest.id);
        if (updated) setSelectedRequest(updated);
      }
    } catch (err) {
      console.error('Failed to load maintenance requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, [currentFlat?.id]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient(`/api/flats/${currentFlat!.id}/maintenance`, {
        method: 'POST',
        body: JSON.stringify({ title, description, location, priority }),
      });

      setTitle('');
      setDescription('');
      setIsModalOpen(false);
      await fetchMaintenance();
    } catch (err) {
      alert('Failed to report maintenance request');
    }
  };

  const handleUpdateStatus = async (requestId: string, status: MaintenanceStatus) => {
    try {
      await apiClient(`/api/maintenance/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await fetchMaintenance();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !newComment.trim()) return;
    try {
      await apiClient(`/api/maintenance/${selectedRequest.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment: newComment }),
      });
      setNewComment('');
      await fetchMaintenance();
    } catch (err) {
      alert('Failed to add comment');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Maintenance Requests
            </h1>
            <Badge variant="purple" size="sm">
              Issue Tracking
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Report plumbing leaks, electrical faults, and appliances requiring landlord/technician repair.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Report Household Issue
        </button>
      </div>

      {/* Grid of issues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className={`bg-white rounded-3xl p-6 border transition-all cursor-pointer shadow-sm ${
                selectedRequest?.id === req.id
                  ? 'border-indigo-400 shadow-lg shadow-indigo-100'
                  : 'border-slate-200/90 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={
                        req.priority === 'emergency'
                          ? 'danger'
                          : req.priority === 'high'
                          ? 'warning'
                          : 'slate'
                      }
                      size="sm"
                    >
                      {req.priority.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      {req.location}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{req.title}</h3>
                </div>

                <select
                  value={req.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleUpdateStatus(req.id, e.target.value as MaintenanceStatus)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                    req.status === 'resolved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : req.status === 'in_progress'
                      ? 'bg-cyan-50 text-cyan-700 border-cyan-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}
                >
                  <option value="open">OPEN</option>
                  <option value="in_progress">IN PROGRESS</option>
                  <option value="resolved">RESOLVED</option>
                </select>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">{req.description}</p>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
                <span>Reported by {req.reporter?.fullName || 'Roommate'}</span>
                <span>{new Date(req.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Detail / Comments Thread */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between h-[520px]">
          {selectedRequest ? (
            <>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Updates & Comments</h3>
                <p className="text-xs text-slate-500 font-medium mb-4">{selectedRequest.title}</p>

                <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
                  {(selectedRequest.comments || []).map((c) => (
                    <div key={c.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-slate-900">{c.user?.fullName || 'Roommate'}</strong>
                        <span className="text-[10px] text-slate-500">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-700">{c.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddComment} className="pt-4 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Post resolution note or technician update..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-colors shadow-md shadow-indigo-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs text-center p-6">
              <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
              <span>Select any maintenance request to view comments and resolution timeline</span>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Report Household Maintenance"
        subtitle="Notify flatmates and log landlord technician visits"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Issue Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Geyser leaking water or AC remote faulty"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Master Bathroom"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-colors"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about what happened, when it started, and if a plumber was notified..."
              rows={3}
              required
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
              Submit Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
