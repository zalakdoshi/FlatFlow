import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  Crown,
  Shield,
  User,
  Zap,
  Building2,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, switchDemoUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'demo' | 'email'>('demo');
  const [selectedFlat, setSelectedFlat] = useState('Skyline Dome Residency 402');

  const DOME_FLATS = [
    {
      name: 'Skyline Dome Residency 402',
      tag: 'Primary Flat',
      wing: 'Dome Wing Tower B',
      location: 'Bengaluru',
      flatmates: '5 Roommates',
      code: 'DOME-402-SYNC',
    },
    {
      name: 'The Dome Cyber Towers 1104',
      tag: 'Duplex Flat',
      wing: 'Dome Tower A, 11th Fl',
      location: 'Mumbai',
      flatmates: '4 Roommates',
      code: 'DOME-1104-LIVE',
    },
    {
      name: 'Solarium Dome Palms 201',
      tag: 'Penthouse',
      wing: 'Palm Block C',
      location: 'Hyderabad',
      flatmates: '3 Roommates',
      code: 'PALM-201-HUB',
    },
  ];

  const DEMO_ROOMMATES = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Zalak',
      role: 'Owner & Admin',
      roles: ['Owner', 'Admin'],
      icon: Crown,
      badgeVariant: 'warning' as const,
      tag: 'Flat Creator & Super Admin',
      avatarBg: 'from-amber-400 via-orange-500 to-amber-600',
      description: 'Full admin access, billing & flat management',
      balancePreview: '+₹2,150.00',
      balanceColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Aarav',
      role: 'Admin',
      roles: ['Admin'],
      icon: Shield,
      badgeVariant: 'primary' as const,
      tag: 'Co-tenant & Admin',
      avatarBg: 'from-indigo-500 via-purple-500 to-cyan-500',
      description: 'Coordinates utility bills and rotates weekly chores',
      balancePreview: '-₹620.00',
      balanceColor: 'text-rose-700 bg-rose-50 border-rose-200',
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Tirth',
      role: 'Member',
      roles: ['Member'],
      icon: User,
      badgeVariant: 'purple' as const,
      tag: 'Resident Flatmate',
      avatarBg: 'from-purple-500 via-pink-500 to-rose-500',
      description: 'Splits shared groceries and tracks cleaning tasks',
      balancePreview: '-₹840.00',
      balanceColor: 'text-rose-700 bg-rose-50 border-rose-200',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (userId: string, name: string) => {
    setLoading(true);
    await switchDemoUser(userId, name);
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-[#f8fafc] text-slate-900 p-4 sm:p-8 relative overflow-x-hidden">
      {/* Light Theme Pastel Aurora Ambient Background */}
      <div className="aurora-bg">
        <div className="aurora-orb-1" />
        <div className="aurora-orb-2" />
        <div className="aurora-orb-3" />
      </div>

      {/* Top Floating Brand Header */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 shadow-xl shadow-indigo-500/20">
            <Home className="w-5 h-5 text-white" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-800 bg-clip-text text-transparent">
                FlatFlow
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Light
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Smart Shared Living Platform
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-xs text-xs font-semibold text-slate-700">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>Realtime Dome Sync Active</span>
        </div>
      </div>

      {/* Main Centered Floating Glass Card */}
      <div className="relative z-10 w-full max-w-2xl my-8">
        <div className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl shadow-indigo-500/10 p-6 sm:p-8 relative overflow-hidden">
          {/* Top Decorative Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dome Flatmate Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In to Your Dome Flat
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Select your profile for instant 1-click access, or sign in with email credentials.
            </p>
          </div>

          {/* Dome Flats Showcase Selector */}
          <div className="mb-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                Select Household / Flat
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                Active Household
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DOME_FLATS.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => setSelectedFlat(f.name)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                    selectedFlat === f.name
                      ? 'bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-400/40 text-slate-900'
                      : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <p className="font-bold text-[11px] truncate text-slate-800">{f.name}</p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {f.location}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 mb-5 rounded-2xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('demo')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'demo'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>1-Click Flatmate Access</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'email'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Email &amp; Password</span>
            </button>
          </div>

          {/* TAB 1: 1-Click Flatmate Access (Zalak as Owner, Aarav as Admin, Tirth as Member) */}
          {activeTab === 'demo' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
                <span>Select profile ({selectedFlat}):</span>
                <span className="text-emerald-700 font-bold">● Instant 1-Click Access</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DEMO_ROOMMATES.map((rm) => (
                  <button
                    key={rm.id}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickDemo(rm.id, rm.name)}
                    className="group relative flex flex-col justify-between p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 transition-all text-left cursor-pointer active:scale-[0.98]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${rm.avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-md shadow-slate-200`}
                        >
                          {rm.name.charAt(0)}
                        </div>
                        <div className="flex items-center gap-1">
                          {rm.roles.map((r) => (
                            <Badge
                              key={r}
                              variant={r === 'Owner' ? 'warning' : r === 'Admin' ? 'primary' : 'purple'}
                              size="sm"
                            >
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors block">
                        {rm.name}
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium mb-3">{rm.tag}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium text-[10px]">Balance:</span>
                      <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${rm.balanceColor}`}>
                        {rm.balancePreview}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-center text-[11px] text-slate-400 pt-1 font-medium">
                💡 Zalak has full Owner administrative controls. Aarav and Tirth are co-residents.
              </p>
            </div>
          ) : (
            /* TAB 2: Traditional Email & Password */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Quick Fill Demo Helper */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  ⚡ Quick Test Login (Auto-fill):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('zalak@flatflow.dev');
                      setPassword('password123');
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    👑 Zalak (Owner)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('aarav@flatflow.dev');
                      setPassword('password123');
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    🛡️ Aarav (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('tirth@flatflow.dev');
                      setPassword('password123');
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
                  >
                    👥 Tirth (Flatmate)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="zalak@flatflow.dev"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-[0.99] transition-all cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In With Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer inside card */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
            New roommate or moving into a flat?{' '}
            <Link
              to="/signup"
              className="font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              Create your flat account &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Trust Badges */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-500 font-semibold pb-2">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Realtime Supabase PostgreSQL</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Strict Integer Paise Precision</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Fair Chore Rotation Algorithm</span>
        </div>
      </div>
    </div>
  );
};
