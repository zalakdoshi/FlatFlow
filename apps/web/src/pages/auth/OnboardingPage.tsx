import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Plus, Users, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/api-client';
import type { Flat } from '@flatflow/shared';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentFlat, refreshFlats } = useAuth();

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [flatName, setFlatName] = useState('');
  const [addressLabel, setAddressLabel] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await apiClient<{ flat: Flat; inviteCode: string }>('/api/flats', {
        method: 'POST',
        body: JSON.stringify({
          name: flatName,
          addressLabel: addressLabel || undefined,
          currency,
        }),
      });
      await refreshFlats();
      setCurrentFlat(res.flat);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create flat');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await apiClient<{ flat: Flat; message: string }>(
        `/api/invites/${inviteCode.trim()}/accept`,
        { method: 'POST' }
      );
      await refreshFlats();
      setCurrentFlat(res.flat);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid invitation code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 text-slate-800 p-6 relative">
      <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl shadow-slate-200/50 z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20 text-white">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">FlatFlow Onboarding</h1>
            <p className="text-xs text-indigo-600 font-semibold">Step 1 of 1: Connect to a Flat</p>
          </div>
        </div>

        {/* Tab selection */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200/80 mb-6">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Create New Flat
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'join'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Join with Code
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {activeTab === 'create' ? (
          <form onSubmit={handleCreateFlat} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Flat Name / Apartment
              </label>
              <input
                type="text"
                value={flatName}
                onChange={(e) => setFlatName(e.target.value)}
                placeholder="e.g. Greenwood Residency 402"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address or Building Tag (Optional)
              </label>
              <input
                type="text"
                value={addressLabel}
                onChange={(e) => setAddressLabel(e.target.value)}
                placeholder="e.g. Tower B, 4th Floor, Koramangala"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Household Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-colors cursor-pointer"
              >
                <option value="INR">₹ INR (Indian Rupee - default in Paise)</option>
                <option value="USD">$ USD (US Dollar)</option>
                <option value="EUR">€ EUR (Euro)</option>
                <option value="GBP">£ GBP (British Pound)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-98 transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Flat & Get Invite Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinFlat} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invitation Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. FLAT-402-SYNC"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono tracking-wider uppercase placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                Ask your flatmate or flat owner for the invite code from their Flat Settings.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-98 transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Join Flat Now</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
