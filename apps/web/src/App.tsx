import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { Modal } from './components/common/Modal';
import { apiClient } from './lib/api-client';
import type { Flat } from '@flatflow/shared';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { OnboardingPage } from './pages/auth/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { SettlementsPage } from './pages/SettlementsPage';
import { BillsPage } from './pages/BillsPage';
import { ChoresPage } from './pages/ChoresPage';
import { GroceriesPage } from './pages/GroceriesPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { VisitorsPage } from './pages/VisitorsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { CalendarPage } from './pages/CalendarPage';
import { SettingsPage } from './pages/SettingsPage';

// Protected Application Layout
const ProtectedLayout: React.FC = () => {
  const { user, profile, loading, currentFlat, setCurrentFlat, refreshFlats, isDemoMode } =
    useAuth();
  const navigate = useNavigate();

  // Global Quick Action Modal States
  const [createFlatModalOpen, setCreateFlatModalOpen] = useState(false);
  const [joinFlatModalOpen, setJoinFlatModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);

  // Create flat form
  const [newFlatName, setNewFlatName] = useState('');
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">Loading FlatFlow...</span>
        </div>
      </div>
    );
  }

  // If not logged in and not in demo exploration mode, route to login
  if (!user && (!isDemoMode || !profile)) {
    return <Navigate to="/login" replace />;
  }

  const handleCreateFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    try {
      setModalLoading(true);
      const res = await apiClient<{ flat: Flat }>('/api/flats', {
        method: 'POST',
        body: JSON.stringify({
          name: newFlatName,
          addressLabel: newAddressLabel || undefined,
        }),
      });
      await refreshFlats();
      setCurrentFlat(res.flat);
      setCreateFlatModalOpen(false);
      setNewFlatName('');
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Failed to create flat');
    } finally {
      setModalLoading(false);
    }
  };

  const handleJoinFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    try {
      setModalLoading(true);
      const res = await apiClient<{ flat: Flat }>(`/api/invites/${joinCode.trim()}/accept`, {
        method: 'POST',
      });
      await refreshFlats();
      setCurrentFlat(res.flat);
      setJoinFlatModalOpen(false);
      setJoinCode('');
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Invalid invite code');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col antialiased">
      <Navbar
        onOpenCreateFlat={() => setCreateFlatModalOpen(true)}
        onOpenJoinFlat={() => setJoinFlatModalOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex flex-shrink-0" />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage
                  onOpenAddExpense={() => setAddExpenseModalOpen(true)}
                  onOpenAddChore={() => navigate('/chores')}
                  onOpenAddGrocery={() => navigate('/groceries')}
                  onOpenReportIssue={() => navigate('/maintenance')}
                />
              }
            />
            <Route
              path="/expenses"
              element={
                <ExpensesPage
                  isOpenAddModal={addExpenseModalOpen}
                  onCloseAddModal={() => setAddExpenseModalOpen(false)}
                />
              }
            />
            <Route path="/settlements" element={<SettlementsPage />} />
            <Route path="/bills" element={<BillsPage />} />
            <Route path="/chores" element={<ChoresPage />} />
            <Route path="/groceries" element={<GroceriesPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/visitors" element={<VisitorsPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Modal: Create Flat */}
      <Modal
        isOpen={createFlatModalOpen}
        onClose={() => setCreateFlatModalOpen(false)}
        title="Create New Dome Flat"
        subtitle="Start a shared household hub and invite flatmates"
      >
        <form onSubmit={handleCreateFlat} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">{modalError}</div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Flat Name</label>
            <input
              type="text"
              value={newFlatName}
              onChange={(e) => setNewFlatName(e.target.value)}
              placeholder="e.g. Skyline Dome Residency 402"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Address / Building Tag
            </label>
            <input
              type="text"
              value={newAddressLabel}
              onChange={(e) => setNewAddressLabel(e.target.value)}
              placeholder="e.g. Tower B, Dome Wing, Bengaluru"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setCreateFlatModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
            >
              {modalLoading ? 'Creating...' : 'Create Flat'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Join Flat */}
      <Modal
        isOpen={joinFlatModalOpen}
        onClose={() => setJoinFlatModalOpen(false)}
        title="Join Flat with Code"
        subtitle="Enter the code provided by your flatmate (e.g. DOME-402-SYNC)"
      >
        <form onSubmit={handleJoinFlat} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">{modalError}</div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Invitation Code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. DOME-402-SYNC"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-mono uppercase font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setJoinFlatModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
            >
              {modalLoading ? 'Joining...' : 'Join Flat'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Notifications */}
      <Modal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="In-App Notifications"
        subtitle="Real-time alerts for expenses, chore assignments, and deadlines"
      >
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-xs">
            <p className="font-bold text-slate-900 mb-0.5">Bescom Dome Electricity Bill Due Soon</p>
            <p className="text-slate-600">
              Electricity bill of ₹3,500 is due in 4 days. Please pay your share of ₹700.
            </p>
            <span className="text-[10px] text-indigo-600 font-semibold mt-2 block">1 hour ago</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <p className="font-bold text-slate-900 mb-0.5">Chore Rotation Assigned</p>
            <p className="text-slate-600">
              You have been assigned: &quot;Deep Clean Kitchen Counters &amp; Modular Stove&quot;.
            </p>
            <span className="text-[10px] text-slate-400 font-semibold mt-2 block">Yesterday</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
