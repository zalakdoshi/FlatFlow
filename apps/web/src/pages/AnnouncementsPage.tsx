import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Pin, CheckCircle2, User, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import type { Announcement } from '@flatflow/shared';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const AnnouncementsPage: React.FC = () => {
  const { currentFlat, profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const fetchAnnouncements = async () => {
    if (!currentFlat) return;
    try {
      setLoading(true);
      const res = await apiClient<{ announcements: Announcement[] }>(
        `/api/flats/${currentFlat.id}/announcements`
      );
      setAnnouncements(res.announcements);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [currentFlat?.id]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient(`/api/announcements/${id}/read`, { method: 'POST' });
      await fetchAnnouncements();
    } catch (err) {
      // Ignore
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient(`/api/flats/${currentFlat!.id}/announcements`, {
        method: 'POST',
        body: JSON.stringify({ title, content, isPinned }),
      });

      setTitle('');
      setContent('');
      setIsPinned(false);
      setIsModalOpen(false);
      await fetchAnnouncements();
    } catch (err) {
      alert('Failed to publish announcement');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Announcements &amp; Notice Board
            </h1>
            <Badge variant="purple" size="sm">
              Household Updates
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Publish notices about society water cuts, rent deadlines, power maintenance, and shared rules.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Publish Notice
        </button>
      </div>

      {/* Announcements Feed */}
      <div className="space-y-4 max-w-4xl">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className={`bg-white rounded-3xl p-6 sm:p-7 border shadow-sm transition-all ${
              ann.isPinned
                ? 'border-indigo-300 shadow-indigo-100 shadow-lg'
                : 'border-slate-200/90'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold ${
                    ann.isPinned
                      ? 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {ann.isPinned ? <Pin className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{ann.title}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-medium">
                    <span>By {ann.author?.fullName || 'Roommate'}</span>
                    <span>&bull;</span>
                    <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {ann.isPinned && (
                <Badge variant="purple" size="sm">
                  PINNED NOTICE
                </Badge>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed my-4 pl-12 whitespace-pre-line">
              {ann.content}
            </p>

            <div className="pt-3 border-t border-slate-100 pl-12 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 font-medium">
                Acknowledged by {ann.readByCount ?? 1} flatmate(s)
              </span>

              {!ann.hasRead && (
                <button
                  onClick={() => handleMarkAsRead(ann.id)}
                  className="px-3 py-1.5 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mark as Read</span>
                </button>
              )}

              {ann.hasRead && (
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Read
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Publish Announcement"
        subtitle="Notifies all flatmates on their dashboard and in-app inbox"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notice Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Water Tank Cleaning on Sunday Morning"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notice Details</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Explain the timings, precautions, or house rules clearly..."
              rows={4}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pinCheck"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="pinCheck" className="text-xs text-slate-700 cursor-pointer font-medium">
              Pin to top of notice board
            </label>
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
              Publish Notice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
