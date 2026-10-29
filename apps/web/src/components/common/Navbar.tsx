import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Bell,
  ChevronDown,
  Plus,
  Users,
  LogOut,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Building2,
  Crown,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';

interface NavbarProps {
  onOpenCreateFlat: () => void;
  onOpenJoinFlat: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateFlat,
  onOpenJoinFlat,
  onOpenNotifications,
  unreadNotificationsCount = 2,
}) => {
  const navigate = useNavigate();
  const {
    profile,
    currentFlat,
    setCurrentFlat,
    flats,
    logout,
    userRole,
    isAdmin,
  } = useAuth();
  const [flatDropdownOpen, setFlatDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200/90 shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/20">
            <Home className="w-5 h-5 text-white" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-800 bg-clip-text text-transparent">
                FlatFlow
              </span>
              <Badge variant="purple" size="sm">
                Live Sync
              </Badge>
            </div>
            <p className="text-[10px] text-slate-500 tracking-wide font-semibold">
              SMART SHARED LIVING PLATFORM
            </p>
          </div>
        </div>

        {/* Center / Flat Switcher */}
        <div className="relative">
          <button
            onClick={() => setFlatDropdownOpen(!flatDropdownOpen)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-slate-100 transition-all text-sm font-semibold text-slate-800 shadow-xs"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="max-w-[150px] sm:max-w-[220px] truncate">
              {currentFlat?.name ?? 'Skyline Dome Residency 402'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {flatDropdownOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 animate-scale-in">
              <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Your Dome Flats
              </div>
              <div className="space-y-1">
                {flats.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setCurrentFlat(f);
                      setFlatDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentFlat?.id === f.id
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{f.name}</span>
                    {currentFlat?.id === f.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </button>
                ))}
              </div>

              <div className="my-2 border-t border-slate-100" />

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setFlatDropdownOpen(false);
                    onOpenCreateFlat();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Create New Flat
                </button>
                <button
                  onClick={() => {
                    setFlatDropdownOpen(false);
                    onOpenJoinFlat();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-cyan-600 hover:bg-cyan-50 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Join With Code (DOME-402-SYNC)
                </button>
                <button
                  onClick={() => {
                    setFlatDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border-t border-slate-100 mt-1 pt-2"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Manage &amp; Remove Households &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Active Role Indicator */}
          <div className="flex items-center">
            {isAdmin ? (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold shadow-2xs"
                title="Admin access active - can approve flat creation requests"
              >
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span>Admin</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold"
                title="Normal Flatmate Member"
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Member</span>
              </div>
            )}
          </div>

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Profile / Menu */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-indigo-500/20">
                {profile?.fullName?.charAt(0) ?? 'Z'}
              </div>
              <span className="hidden md:inline text-xs font-bold text-slate-800">
                {profile?.fullName?.split(' ')[0] ?? 'Zalak'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:inline" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 animate-scale-in">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{profile?.fullName ?? 'Aarav'}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {profile?.phone || '+91 98201 11223'}
                  </p>
                </div>

                <div className="py-2 px-3 border-b border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-600">Account Role:</span>
                  <Badge variant={isAdmin ? 'warning' : 'purple'} size="sm">
                    {isAdmin ? 'ADMIN / OWNER' : 'MEMBER'}
                  </Badge>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={async () => {
                      setUserDropdownOpen(false);
                      await logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Direct Sign Out Button on Header */}
          <button
            onClick={async () => {
              setUserDropdownOpen(false);
              await logout();
              navigate('/login');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="Sign out of FlatFlow"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
