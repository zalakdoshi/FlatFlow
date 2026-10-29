import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Flat, UserProfile, MemberRole } from '@flatflow/shared';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { apiClient, setDemoUserId, getDemoUserId } from '../lib/api-client';

export type AccountRole = 'owner' | 'flatmate' | 'admin' | 'tenant';

export interface StoredAccount {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: AccountRole;
  phone?: string;
  createdAt: string;
  assignedFlatIds: string[];
}

interface SignupOptions {
  role?: AccountRole;
  flatAction?: 'create' | 'join' | 'demo';
  flatName?: string;
  inviteCode?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  currentFlat: Flat | null;
  setCurrentFlat: (flat: Flat | null) => void;
  flats: Flat[];
  loading: boolean;
  isDemoMode: boolean;
  userRole: AccountRole;
  isAdmin: boolean;
  refreshFlats: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    fullName: string,
    email: string,
    password: string,
    options?: SignupOptions
  ) => Promise<{ needEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  switchDemoUser: (userId: string, fullName: string, role?: AccountRole) => Promise<void>;
  removeHousehold: (flatId: string) => Promise<void>;
  leaveHousehold: (flatId: string) => Promise<void>;
}

const PRESET_ACCOUNTS: Record<string, { id: string; name: string; role: AccountRole }> = {
  'zalak@flatflow.dev': { id: '11111111-1111-1111-1111-111111111111', name: 'Zalak', role: 'owner' },
  'zalak@flatflow.app': { id: '11111111-1111-1111-1111-111111111111', name: 'Zalak', role: 'owner' },
  'zalak': { id: '11111111-1111-1111-1111-111111111111', name: 'Zalak', role: 'owner' },

  'aarav@flatflow.dev': { id: '22222222-2222-2222-2222-222222222222', name: 'Aarav', role: 'admin' },
  'aarav@flatflow.app': { id: '22222222-2222-2222-2222-222222222222', name: 'Aarav', role: 'admin' },
  'aarav': { id: '22222222-2222-2222-2222-222222222222', name: 'Aarav', role: 'admin' },
  'riva@flatflow.dev': { id: '22222222-2222-2222-2222-222222222222', name: 'Aarav', role: 'admin' },
  'riva@flatflow.app': { id: '22222222-2222-2222-2222-222222222222', name: 'Aarav', role: 'admin' },
  'riva': { id: '22222222-2222-2222-2222-222222222222', name: 'Aarav', role: 'admin' },

  'tirth@flatflow.dev': { id: '33333333-3333-3333-3333-333333333333', name: 'Tirth', role: 'flatmate' },
  'tirth@flatflow.app': { id: '33333333-3333-3333-3333-333333333333', name: 'Tirth', role: 'flatmate' },
  'tirth': { id: '33333333-3333-3333-3333-333333333333', name: 'Tirth', role: 'flatmate' },

  'prisha@flatflow.dev': { id: '44444444-4444-4444-4444-444444444444', name: 'Prisha', role: 'flatmate' },
  'prisha@flatflow.app': { id: '44444444-4444-4444-4444-444444444444', name: 'Prisha', role: 'flatmate' },
  'prisha': { id: '44444444-4444-4444-4444-444444444444', name: 'Prisha', role: 'flatmate' },

  'twisha@flatflow.dev': { id: '55555555-5555-5555-5555-555555555555', name: 'Twisha', role: 'flatmate' },
  'twisha@flatflow.app': { id: '55555555-5555-5555-5555-555555555555', name: 'Twisha', role: 'flatmate' },
  'twisha': { id: '55555555-5555-5555-5555-555555555555', name: 'Twisha', role: 'flatmate' },

  'vedant@flatflow.dev': { id: '66666666-6666-6666-6666-666666666666', name: 'Vedant', role: 'flatmate' },
  'vedant@flatflow.app': { id: '66666666-6666-6666-6666-666666666666', name: 'Vedant', role: 'flatmate' },
  'vedant': { id: '66666666-6666-6666-6666-666666666666', name: 'Vedant', role: 'flatmate' },
};

function getStoredCustomAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem('flatflow_custom_accounts');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomAccount(account: StoredAccount) {
  const existing = getStoredCustomAccounts();
  const filtered = existing.filter((a) => a.email.toLowerCase() !== account.email.toLowerCase());
  filtered.push(account);
  localStorage.setItem('flatflow_custom_accounts', JSON.stringify(filtered));
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [currentFlat, setCurrentFlat] = useState<Flat | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(Boolean(getDemoUserId()));
  const [userRole, setUserRole] = useState<AccountRole>('owner');

  const refreshProfile = async () => {
    const demoId = getDemoUserId();
    const { data } = await supabase.auth.getSession();
    if (!data.session && !demoId) {
      setProfile(null);
      return;
    }
    try {
      const res = await apiClient<{ profile: UserProfile }>('/api/users/profile');
      setProfile(res.profile);
    } catch {
      // Fallback for custom accounts in localStorage
      const customAccounts = getStoredCustomAccounts();
      const currentAcc = customAccounts.find((a) => a.id === demoId);
      if (currentAcc) {
        setProfile({
          id: currentAcc.id,
          fullName: currentAcc.fullName,
          avatarUrl: null,
          phone: currentAcc.phone || null,
          createdAt: currentAcc.createdAt,
          updatedAt: currentAcc.createdAt,
        });
        setUserRole(currentAcc.role);
      } else {
        setProfile(null);
      }
    }
  };

  const refreshFlats = async () => {
    const demoId = getDemoUserId();
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session && !demoId) {
      setFlats([]);
      setCurrentFlat(null);
      return;
    }

    try {
      const data = await apiClient<{ flats: Flat[] }>('/api/flats');
      setFlats(data.flats);

      const savedFlatId = localStorage.getItem('flatflow_active_flat');
      const found = data.flats.find((f) => f.id === savedFlatId);

      if (found) {
        setCurrentFlat(found);
      } else if (data.flats.length > 0) {
        setCurrentFlat(data.flats[0]!);
        localStorage.setItem('flatflow_active_flat', data.flats[0]!.id);
      } else {
        setCurrentFlat(null);
      }
    } catch (err) {
      console.error('Error fetching flats:', err);
    }
  };

  useEffect(() => {
    async function initAuth() {
      setLoading(true);
      const demoId = getDemoUserId();

      // Determine initial user role if available
      if (demoId) {
        const foundPreset = Object.values(PRESET_ACCOUNTS).find((a) => a.id === demoId);
        if (foundPreset) {
          setUserRole(foundPreset.role);
        } else {
          const customAccounts = getStoredCustomAccounts();
          const currentAcc = customAccounts.find((a) => a.id === demoId);
          if (currentAcc) setUserRole(currentAcc.role);
        }
      }

      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase.auth.getSession();
          setSession(data.session);
          setUser(data.session?.user ?? null);
          setIsDemoMode(!data.session && Boolean(demoId));
        } catch {
          setIsDemoMode(Boolean(demoId));
        }
      } else {
        setIsDemoMode(Boolean(demoId));
      }

      if (demoId || session?.user) {
        await refreshProfile();
        await refreshFlats();
      } else {
        setProfile(null);
      }
      setLoading(false);
    }

    initAuth();

    if (isSupabaseConfigured) {
      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession) {
          setIsDemoMode(false);
          await refreshProfile();
          await refreshFlats();
        }
      });
      return () => listener.subscription.unsubscribe();
    }
  }, []);

  const handleSetCurrentFlat = (flat: Flat | null) => {
    setCurrentFlat(flat);
    if (flat) {
      localStorage.setItem('flatflow_active_flat', flat.id);
    } else {
      localStorage.removeItem('flatflow_active_flat');
    }
  };

  const login = async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase();

    // 1. Check if Supabase cloud auth is enabled
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password });
      if (error) throw error;
      setSession(data.session);
      setUser(data.user);
      setIsDemoMode(false);
      setDemoUserId(null);
      await refreshProfile();
      await refreshFlats();
      return;
    }

    // 2. Check local presets (Zalak, Aarav, Tirth, Prisha, Twisha, Vedant)
    const preset = PRESET_ACCOUNTS[normalized];
    if (preset) {
      setIsDemoMode(true);
      setDemoUserId(preset.id);
      setUserRole(preset.role);
      await refreshProfile();
      await refreshFlats();
      return;
    }

    // 3. Check custom registered accounts created on this browser
    const customAccounts = getStoredCustomAccounts();
    const matchedAccount = customAccounts.find((a) => a.email.toLowerCase() === normalized);

    if (matchedAccount) {
      if (matchedAccount.password !== password) {
        throw new Error('Incorrect password. Please try again or use 1-click roommate access.');
      }
      setIsDemoMode(true);
      setDemoUserId(matchedAccount.id);
      setUserRole(matchedAccount.role);
      await refreshProfile();
      await refreshFlats();
      return;
    }

    // 4. If nothing matches
    throw new Error(
      `No account found for "${email}". You can create a new account via Sign Up, or select a flatmate from the 1-Click Flatmate Access tab.`
    );
  };

  const signup = async (
    fullName: string,
    email: string,
    password: string,
    options?: SignupOptions
  ) => {
    const normalizedEmail = email.trim().toLowerCase();
    const selectedRole = options?.role || 'flatmate';

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            role: selectedRole,
          },
        },
      });
      if (error) throw error;
      const needConfirmation = !data.session;
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        setIsDemoMode(false);
      }
      return { needEmailConfirmation: needConfirmation };
    }

    // Local / Dev mode account registration
    const newUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newAccount: StoredAccount = {
      id: newUserId,
      fullName,
      email: normalizedEmail,
      password,
      role: selectedRole,
      createdAt: new Date().toISOString(),
      assignedFlatIds: [],
    };
    saveCustomAccount(newAccount);

    setIsDemoMode(true);
    setDemoUserId(newUserId);
    setUserRole(selectedRole);

    // Initial flat setup if requested
    if (options?.flatAction === 'create' && options.flatName) {
      try {
        const flatRes = await apiClient<{ flat: Flat }>('/api/flats', {
          method: 'POST',
          body: JSON.stringify({ name: options.flatName }),
        });
        setCurrentFlat(flatRes.flat);
      } catch (err) {
        console.error('Failed to auto-create flat on signup:', err);
      }
    } else if (options?.flatAction === 'join' && options.inviteCode) {
      try {
        const joinRes = await apiClient<{ flat: Flat }>(
          `/api/invites/${options.inviteCode.trim()}/accept`,
          { method: 'POST' }
        );
        setCurrentFlat(joinRes.flat);
      } catch (err) {
        console.error('Failed to auto-join flat on signup:', err);
      }
    }

    await refreshProfile();
    await refreshFlats();
    return { needEmailConfirmation: false };
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    setCurrentFlat(null);
    setDemoUserId(null);
    setIsDemoMode(false);
    setUserRole('owner');
    localStorage.removeItem('flatflow_demo_user');
    localStorage.removeItem('flatflow_active_flat');
  };

  const switchDemoUser = async (userId: string, fullName: string, role?: AccountRole) => {
    setDemoUserId(userId);
    setIsDemoMode(true);
    if (role) {
      setUserRole(role);
    } else {
      const preset = Object.values(PRESET_ACCOUNTS).find((a) => a.id === userId);
      if (preset) setUserRole(preset.role);
    }
    setProfile({
      id: userId,
      fullName,
      avatarUrl: null,
      phone: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await refreshFlats();
  };

  const removeHousehold = async (flatId: string) => {
    try {
      await apiClient(`/api/flats/${flatId}`, { method: 'DELETE' });
      await refreshFlats();
      // If current flat was removed, select next available flat
      if (currentFlat?.id === flatId) {
        const remaining = flats.filter((f) => f.id !== flatId);
        if (remaining.length > 0) {
          handleSetCurrentFlat(remaining[0]!);
        } else {
          handleSetCurrentFlat(null);
        }
      }
    } catch (err) {
      console.error('Failed to remove household:', err);
      throw err;
    }
  };

  const leaveHousehold = async (flatId: string) => {
    try {
      await apiClient(`/api/flats/${flatId}/leave`, { method: 'POST' });
      await refreshFlats();
      if (currentFlat?.id === flatId) {
        const remaining = flats.filter((f) => f.id !== flatId);
        if (remaining.length > 0) {
          handleSetCurrentFlat(remaining[0]!);
        } else {
          handleSetCurrentFlat(null);
        }
      }
    } catch (err) {
      console.error('Failed to leave household:', err);
      throw err;
    }
  };

  const isAdmin = userRole === 'admin' || userRole === 'owner';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        currentFlat,
        setCurrentFlat: handleSetCurrentFlat,
        flats,
        loading,
        isDemoMode,
        userRole,
        isAdmin,
        refreshFlats,
        refreshProfile,
        login,
        signup,
        logout,
        switchDemoUser,
        removeHousehold,
        leaveHousehold,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
