import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Copy,
  Check,
  X,
  RefreshCw,
  Shield,
  Home,
  User,
  Key,
  Building2,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import type { Flat, FlatMember } from '@flatflow/shared';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

interface FlatCreationRequest {
  id: string;
  name: string;
  addressLabel: string | null;
  currency: string;
  requestedBy: string;
  requesterName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export const SettingsPage: React.FC = () => {
  const {
    currentFlat,
    setCurrentFlat,
    flats,
    profile,
    refreshProfile,
    refreshFlats,
    removeHousehold,
    leaveHousehold,
    isAdmin,
    userRole,
  } = useAuth();

  const [members, setMembers] = useState<FlatMember[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Household requests and approval queue
  const [flatRequests, setFlatRequests] = useState<FlatCreationRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Household management modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [confirmRemoveFlat, setConfirmRemoveFlat] = useState<Flat | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form states for creating/joining
  const [newFlatName, setNewFlatName] = useState('');
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');

  // Profile edit
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const fetchSettings = async () => {
    if (!currentFlat) return;
    try {
      setLoading(true);
      const res = await apiClient<{
        flat: unknown;
        members: FlatMember[];
        inviteCode: string | null;
      }>(`/api/flats/${currentFlat.id}`);
      setMembers(res.members);
      setInviteCode(res.inviteCode || 'DOME-402-SYNC');
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlatRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await apiClient<{ requests: FlatCreationRequest[] }>('/api/flats-requests');
      setFlatRequests(res.requests);
    } catch (err) {
      console.error('Failed to load flat requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [currentFlat?.id]);

  useEffect(() => {
    fetchFlatRequests();
  }, []);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateNewInvite = async () => {
    try {
      const res = await apiClient<{ invite: { code: string } }>(
        `/api/flats/${currentFlat!.id}/invites`,
        {
          method: 'POST',
          body: JSON.stringify({ expiresInDays: 14, maxUses: 15 }),
        }
      );
      setInviteCode(res.invite.code);
    } catch (err) {
      alert('Failed to generate invite code');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await apiClient('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ fullName, phone }),
      });
      await refreshProfile();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit request to add flat (Requires Admin Approval)
  const handleSubmitFlatRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      setActionLoading(true);
      const res = await apiClient<{ request: FlatCreationRequest }>('/api/flats-requests', {
        method: 'POST',
        body: JSON.stringify({
          name: newFlatName,
          addressLabel: newAddressLabel || undefined,
        }),
      });

      await fetchFlatRequests();
      setCreateModalOpen(false);
      const requestedName = newFlatName;
      setNewFlatName('');
      setNewAddressLabel('');

      if (isAdmin) {
        setActionSuccess(
          `Request for "${requestedName}" submitted! As an Admin, you can approve it below in the Admin Approval Queue.`
        );
      } else {
        setActionSuccess(
          `Request for "${requestedName}" submitted! An Admin must approve this request before it becomes active. You can switch to Admin account anytime to approve it.`
        );
      }
      setTimeout(() => setActionSuccess(null), 6000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to submit flat request');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin approves flat request
  const handleApproveFlatRequest = async (requestId: string) => {
    try {
      setActionLoading(true);
      const res = await apiClient<{ success: boolean; message: string; flat: Flat }>(
        `/api/flats-requests/${requestId}/approve`,
        { method: 'POST' }
      );
      await fetchFlatRequests();
      await refreshFlats();
      setCurrentFlat(res.flat);
      setActionSuccess(`Flat "${res.flat.name}" has been approved by Admin and is now ACTIVE!`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to approve flat request');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin rejects flat request
  const handleRejectFlatRequest = async (requestId: string) => {
    try {
      setActionLoading(true);
      await apiClient(`/api/flats-requests/${requestId}/reject`, { method: 'POST' });
      await fetchFlatRequests();
      setActionSuccess('Flat request has been rejected.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinFlatWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      setActionLoading(true);
      const res = await apiClient<{ flat: Flat }>(
        `/api/invites/${joinCodeInput.trim().toUpperCase()}/accept`,
        { method: 'POST' }
      );
      await refreshFlats();
      setCurrentFlat(res.flat);
      setJoinModalOpen(false);
      setJoinCodeInput('');
      setActionSuccess(`Successfully joined and connected to ${res.flat.name}!`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Invalid invitation code');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveHousehold = async () => {
    if (!confirmRemoveFlat) return;
    try {
      setActionLoading(true);
      await removeHousehold(confirmRemoveFlat.id);
      const removedName = confirmRemoveFlat.name;
      setConfirmRemoveFlat(null);
      setActionSuccess(`Household "${removedName}" has been removed.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to remove household');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingRequests = flatRequests.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Flat Settings &amp; Members</h1>
            <Badge variant="purple" size="sm">
              Household Administration
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Manage your households, active flat selection, invitations, and admin permissions.
          </p>
        </div>

        {/* Role Indicator Card */}
        <div className="flex items-center gap-2 p-2 px-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-left">
            <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Your Account Role</p>
            <p className="text-xs font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
              {isAdmin ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admin / Owner</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Flatmate Member</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 shadow-xs animate-fade-in font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* SECTION 1: ADMIN APPROVAL QUEUE FOR FLAT CREATION REQUESTS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${isAdmin ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Admin Approval Queue: Flat Requests</h2>
                {pendingRequests.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                    {pendingRequests.length} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {isAdmin
                  ? 'As an Admin, only you have authority to approve or reject requests to add new flats.'
                  : 'Only household administrators can approve new flat requests.'}
              </p>
            </div>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-5 text-center rounded-2xl bg-slate-50/80 border border-dashed border-slate-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-700">All Flat Requests Approved &amp; Up to Date</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Submit a new request using the "+ Request to Add Flat" button below to test the admin approval flow.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-slate-900">{req.name}</h3>
                    <Badge variant="warning" size="sm">
                      AWAITING ADMIN APPROVAL
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {req.addressLabel || 'Dome Flat Residency'} &bull; Currency: {req.currency}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span>Requested by: <strong>{req.requesterName}</strong></span>
                    <span>&bull;</span>
                    <span>{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isAdmin ? (
                    <>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleApproveFlatRequest(req.id)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer transition-all active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve &amp; Activate Flat
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleRejectFlatRequest(req.id)}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 cursor-pointer transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Pending Admin Review
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: YOUR HOUSEHOLDS & ACTIVE FLAT */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Active Households &amp; Flats</h2>
              <p className="text-xs text-slate-500 font-medium">
                Switch your active household, request a new flat, or remove households.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Request to Add Flat
            </button>
            <button
              type="button"
              onClick={() => setJoinModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 border border-slate-200 cursor-pointer transition-all active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              Join Code
            </button>
          </div>
        </div>

        {/* List of Households */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {flats.map((flat) => {
            const isActive = currentFlat?.id === flat.id;
            return (
              <div
                key={flat.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-200 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <Home className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                          {flat.name}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {flat.addressLabel || 'Primary Residence'}
                        </p>
                      </div>
                    </div>

                    {isActive ? (
                      <Badge variant="success" size="sm">
                        ACTIVE FLAT
                      </Badge>
                    ) : (
                      <Badge variant="slate" size="sm">
                        INACTIVE
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100/80 flex items-center justify-between gap-2 mt-2">
                  {isActive ? (
                    <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Currently Selected
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCurrentFlat(flat)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                    >
                      Set as Active Flat
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setConfirmRemoveFlat(flat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title={`Remove ${flat.name} from my households`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Invite Code Generator Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-3xl p-6 sm:p-7 shadow-xl shadow-indigo-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Key className="w-3.5 h-3.5" /> Roommate Invitation Code
            </span>
            <h2 className="text-xl font-extrabold text-white">Invite Flatmates to {currentFlat?.name}</h2>
            <p className="text-xs text-indigo-100 mt-1 max-w-md">
              Share this code with your flatmates. When they sign up or enter it on FlatFlow, they will
              instantly gain access to shared expenses and chores.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-white/30">
              <span className="font-mono text-base font-extrabold tracking-wider text-white">
                {inviteCode ?? 'DOME-402-SYNC'}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                title="Copy Code"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-300" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <button
              onClick={handleGenerateNewInvite}
              className="text-[11px] text-indigo-200 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Regenerate new code</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4: Flat Members Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-indigo-500" />
          <h2 className="text-base font-bold text-slate-900">Flat Members &amp; Permissions ({members.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {m.profile?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p>{m.profile?.fullName || 'Roommate'}</p>
                      <p className="text-[10px] text-slate-500 font-normal">
                        {m.profile?.phone || 'Active flatmate'}
                      </p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        m.role === 'owner' ? 'warning' : m.role === 'admin' ? 'primary' : 'purple'
                      }
                      size="sm"
                    >
                      {m.role === 'owner' ? 'OWNER & ADMIN' : m.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">
                    {new Date(m.joinedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5: Roommate Profile Settings */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-indigo-500" />
          <h2 className="text-base font-bold text-slate-900">Your Roommate Profile</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contact Phone (Optional)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-md shadow-indigo-600/20 transition-all"
            >
              {savingProfile ? 'Saving...' : 'Update Profile'}
            </button>
            {profileSuccess && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Profile saved!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* MODAL: REQUEST TO ADD FLAT (AWAITING ADMIN APPROVAL) */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Request to Add New Household"
        subtitle="Submit a flat request. An Admin must approve this request before the flat is created."
      >
        <form onSubmit={handleSubmitFlatRequest} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {actionError}
            </div>
          )}

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Only an Admin can approve this request. Once approved, the flat will appear live.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Flat Name / Residence</label>
            <input
              type="text"
              value={newFlatName}
              onChange={(e) => setNewFlatName(e.target.value)}
              placeholder="e.g. Greenwood Heights 301"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Address / Landmark (Optional)</label>
            <input
              type="text"
              value={newAddressLabel}
              onChange={(e) => setNewAddressLabel(e.target.value)}
              placeholder="e.g. Tower 2, Koramangala, Bengaluru"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-sm"
            >
              {actionLoading ? 'Submitting...' : 'Submit Request for Approval'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: JOIN FLAT */}
      <Modal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        title="Join Household With Code"
        subtitle="Enter the invite code from your flatmate to join their household"
      >
        <form onSubmit={handleJoinFlatWithCode} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {actionError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Invitation Code</label>
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. DOME-402-SYNC"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold tracking-wider uppercase text-slate-900 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setJoinModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-sm"
            >
              {actionLoading ? 'Joining...' : 'Join Household'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CONFIRM REMOVE / LEAVE HOUSEHOLD */}
      <Modal
        isOpen={Boolean(confirmRemoveFlat)}
        onClose={() => setConfirmRemoveFlat(null)}
        title="Remove Household"
        subtitle={`Remove or leave ${confirmRemoveFlat?.name}?`}
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Are you sure you want to remove this household?</p>
              <p className="text-[11px] mt-0.5">
                "{confirmRemoveFlat?.name}" will be removed from your active households list. You can always rejoin using its invitation code.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setConfirmRemoveFlat(null)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleRemoveHousehold}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-sm"
            >
              {actionLoading ? 'Removing...' : 'Confirm Remove'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
