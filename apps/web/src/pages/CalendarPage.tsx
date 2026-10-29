import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  Filter,
  CheckSquare,
  CreditCard,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import type { CalendarEvent, EventType, EVENT_TYPES } from '@flatflow/shared';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const CalendarPage: React.FC = () => {
  const { currentFlat } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('social');
  const [startAt, setStartAt] = useState(new Date().toISOString().slice(0, 16));
  const [endAt, setEndAt] = useState(new Date(Date.now() + 7200000).toISOString().slice(0, 16));

  const fetchEvents = async () => {
    if (!currentFlat) return;
    try {
      setLoading(true);
      const res = await apiClient<{ events: CalendarEvent[] }>(
        `/api/flats/${currentFlat.id}/events`
      );
      setEvents(res.events);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentFlat?.id]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient(`/api/flats/${currentFlat!.id}/events`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: description || undefined,
          eventType,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
        }),
      });

      setTitle('');
      setDescription('');
      setIsModalOpen(false);
      await fetchEvents();
    } catch (err) {
      alert('Failed to schedule event');
    }
  };

  const filteredEvents = events.filter((e) =>
    selectedType === 'all' ? true : e.eventType === selectedType
  );

  const getEventBadge = (type: EventType) => {
    switch (type) {
      case 'chore':
        return <Badge variant="purple" size="sm">CHORE</Badge>;
      case 'bill':
        return <Badge variant="warning" size="sm">BILL DUE</Badge>;
      case 'visitor':
        return <Badge variant="success" size="sm">VISITOR</Badge>;
      case 'maintenance':
        return <Badge variant="danger" size="sm">REPAIR</Badge>;
      default:
        return <Badge variant="slate" size="sm">HOUSEHOLD</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Shared Calendar</h1>
            <Badge variant="purple" size="sm">
              Integrated Schedule
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Unified household schedule showing chore assignments, bill deadlines, visitor arrivals, and flat events.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Schedule Event
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-sm flex items-center gap-2 overflow-x-auto">
        <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
        {['all', 'chore', 'bill', 'visitor', 'social'].map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              selectedType === t
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Events Agenda Feed */}
      <div className="space-y-3">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex flex-col items-center justify-center border border-indigo-100 text-center flex-shrink-0">
                  <span className="text-[10px] uppercase font-bold text-indigo-500">
                    {new Date(ev.startAt).toLocaleDateString([], { month: 'short' })}
                  </span>
                  <span className="text-sm font-extrabold text-indigo-700 leading-tight">
                    {new Date(ev.startAt).getDate()}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-slate-900">{ev.title}</h3>
                    {getEventBadge(ev.eventType)}
                  </div>
                  {ev.description && <p className="text-xs text-slate-500 font-medium">{ev.description}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-right font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {new Date(ev.startAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-500 text-xs border border-slate-200/90 shadow-sm">
            No events found for this filter.
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Household Event"
        subtitle="Add a social event, house meeting, or roommate dinner"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Event Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monthly Flat House Meeting or Weekend BBQ"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-colors"
              >
                <option value="social">Social / Dinner</option>
                <option value="house_meeting">House Meeting</option>
                <option value="chore">Cleaning Drive</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Starts At</label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ends At</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-colors"
              />
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
              Save Event
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
