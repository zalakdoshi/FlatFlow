import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  AlertCircle,
  Sparkles,
  Building2,
  Crown,
  Shield,
  Users,
  Plus,
  Key,
} from 'lucide-react';
import { useAuth, type AccountRole } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AccountRole>('owner');
  const [flatAction, setFlatAction] = useState<'create' | 'join' | 'demo'>('demo');
  const [newFlatName, setNewFlatName] = useState('Skyline Dome Residency 402');
  const [inviteCode, setInviteCode] = useState('DOME-402-SYNC');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Password strength calculation
  const hasMinLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const strengthScore = [hasMinLength, hasLetter, hasNumber, passwordsMatch].filter(Boolean).length;

  const ROLE_OPTIONS = [
    {
      id: 'owner' as AccountRole,
      title: 'Flat Owner',
      desc: 'Owns or leases the flat. Manages settings, lease rules, and flatmate invites.',
      icon: Crown,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      badge: 'Super Admin',
      badgeVariant: 'warning' as const,
    },
    {
      id: 'flatmate' as AccountRole,
      title: 'Flatmate / Resident',
      desc: 'Lives in the flat. Splits shared groceries, takes chore turns, and settles debts.',
      icon: Users,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      badge: 'Standard Member',
      badgeVariant: 'purple' as const,
    },
    {
      id: 'admin' as AccountRole,
      title: 'Co-Owner / Admin',
      desc: 'Co-manages bills, coordinates maintenance tickets, and approves expenses.',
      icon: Shield,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      badge: 'Co-Manager',
      badgeVariant: 'primary' as const,
    },
    {
      id: 'tenant' as AccountRole,
      title: 'Tenant',
      desc: 'Resident tenant with automatic rent calculation, utility splits, and notices.',
      icon: Home,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      badge: 'Resident',
      badgeVariant: 'success' as const,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const res = await signup(fullName, email, password, {
        role: selectedRole,
        flatAction,
        flatName: flatAction === 'create' ? newFlatName : undefined,
        inviteCode: flatAction === 'join' ? inviteCode : undefined,
      });

      if (res.needEmailConfirmation) {
        setInfoMessage(
          'Registration successful! Please check your email inbox to confirm your account, then log in.'
        );
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
                Register
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Smart Shared Living Platform
            </p>
          </div>
        </div>

        <Link
          to="/login"
          className="text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs transition-colors"
        >
          Sign In Instead &rarr;
        </Link>
      </div>

      {/* Centered Floating Glass Card */}
      <div className="relative z-10 w-full max-w-xl my-6">
        <div className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl shadow-indigo-500/10 p-6 sm:p-8 relative overflow-hidden">
          {/* Heading */}
          <div className="text-center mb-6">
            <Badge variant="purple" size="md" className="mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> New Account Registration
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Create Your Profile
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto font-medium">
              Choose your role and connect to your household flat in seconds.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Role Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>Account Role &amp; Access Level</span>
                <span className="text-[11px] font-semibold text-indigo-600">Select what fits you best</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ROLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedRole === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedRole(opt.id)}
                      className={`text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-200 shadow-sm'
                          : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className={`p-1.5 rounded-xl border ${opt.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <Badge variant={opt.badgeVariant} size="sm">
                          {opt.badge}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900">{opt.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Household Connection */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  Household / Flat Connection
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Step 2 of 2</span>
              </label>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-xl border border-slate-200 mb-3 text-center">
                <button
                  type="button"
                  onClick={() => setFlatAction('demo')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    flatAction === 'demo'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Skyline Dome (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setFlatAction('create')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    flatAction === 'create'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + Create New Flat
                </button>
                <button
                  type="button"
                  onClick={() => setFlatAction('join')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    flatAction === 'join'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Join With Code
                </button>
              </div>

              {flatAction === 'create' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    New Flat / Apartment Name
                  </label>
                  <input
                    type="text"
                    value={newFlatName}
                    onChange={(e) => setNewFlatName(e.target.value)}
                    placeholder="e.g. Skyline Dome Residency 402"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:border-indigo-500 outline-none"
                  />
                </div>
              )}

              {flatAction === 'join' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Flatmate Invitation Code
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g. DOME-402-SYNC"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold tracking-wider uppercase text-slate-900 focus:border-indigo-500 outline-none"
                  />
                </div>
              )}

              {flatAction === 'demo' && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Will auto-connect to primary flat: <strong>Skyline Dome Residency 402</strong></span>
                </div>
              )}
            </div>

            {/* Basic Info: Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aarav, Tirth, or Vedant"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@flatflow.dev"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Password and Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Live Password Strength Indicator */}
            {password.length > 0 && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-500">Security Strength</span>
                  <span
                    className={
                      strengthScore <= 1
                        ? 'text-rose-600'
                        : strengthScore <= 3
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }
                  >
                    {strengthScore <= 1 ? 'Weak' : strengthScore <= 3 ? 'Good' : 'Strong'}
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 transition-all rounded-full ${
                        step <= strengthScore
                          ? strengthScore <= 1
                            ? 'bg-rose-500'
                            : strengthScore <= 3
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                          : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-[0.99] transition-all cursor-pointer mt-3"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create {ROLE_OPTIONS.find((r) => r.id === selectedRole)?.title} Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700">
              Sign In &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="relative z-10 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium pb-2">
        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
        <span>Manage multiple households or dome flats from your dashboard anytime</span>
      </div>
    </div>
  );
};
