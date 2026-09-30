import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export interface DemoUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'sarah.pm@taskflow.dev',
    fullName: 'Sarah Product Manager',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    role: 'Owner',
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'alex.developer@taskflow.dev',
    fullName: 'Alex Developer',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    role: 'Admin',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'john.designer@taskflow.dev',
    fullName: 'John Designer',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    role: 'Member',
  },
];

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoUser: boolean;

  // Actions
  initializeAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoUser: (demoUser: DemoUser) => void;
}

const LOCAL_STORAGE_DEMO_KEY = 'taskflow_demo_user';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isDemoUser: false,

  initializeAuth: async () => {
    set({ isLoading: true });

    // Check if Supabase is configured
    if (isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            avatarUrl: session.user.user_metadata?.avatar_url,
          };

          set({
            session,
            user: session.user,
            token: session.access_token,
            profile,
            isAuthenticated: true,
            isDemoUser: false,
            isLoading: false,
          });
          return;
        }

        // Listen for auth state changes
        supabase.auth.onAuthStateChange((_event, currentSession) => {
          if (currentSession) {
            set({
              session: currentSession,
              user: currentSession.user,
              token: currentSession.access_token,
              profile: {
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                fullName: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0] || 'User',
                avatarUrl: currentSession.user.user_metadata?.avatar_url,
              },
              isAuthenticated: true,
              isDemoUser: false,
            });
          } else if (!get().isDemoUser) {
            set({
              session: null,
              user: null,
              token: null,
              profile: null,
              isAuthenticated: false,
            });
          }
        });
      } catch (err) {
        console.warn('Supabase auth initialization error, falling back to local session:', err);
      }
    }

    // Check saved demo user in localStorage
    const savedDemo = localStorage.getItem(LOCAL_STORAGE_DEMO_KEY);
    if (savedDemo) {
      try {
        const demoUser: DemoUser = JSON.parse(savedDemo);
        set({
          profile: {
            id: demoUser.id,
            email: demoUser.email,
            fullName: demoUser.fullName,
            avatarUrl: demoUser.avatarUrl,
          },
          token: `demo-bearer-token:${demoUser.id}`,
          isAuthenticated: true,
          isDemoUser: true,
          isLoading: false,
        });
        return;
      } catch {
        localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
      }
    }

    // Default to first demo user (Sarah PM) if not logged in to make developer experience smooth
    const defaultDemo = DEMO_USERS[0];
    localStorage.setItem(LOCAL_STORAGE_DEMO_KEY, JSON.stringify(defaultDemo));
    set({
      profile: {
        id: defaultDemo.id,
        email: defaultDemo.email,
        fullName: defaultDemo.fullName,
        avatarUrl: defaultDemo.avatarUrl,
      },
      token: `demo-bearer-token:${defaultDemo.id}`,
      isAuthenticated: true,
      isDemoUser: true,
      isLoading: false,
    });
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      if (!isSupabaseConfigured()) {
        // Find matching demo user or create session
        const demoMatch = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (demoMatch) {
          get().loginAsDemoUser(demoMatch);
          return { success: true };
        }
        // Generic dev login
        const customUser: DemoUser = {
          id: '11111111-1111-1111-1111-111111111111',
          email,
          fullName: email.split('@')[0],
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          role: 'Member',
        };
        get().loginAsDemoUser(customUser);
        return { success: true };
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        set({ isLoading: false });
        return { success: false, error: error.message };
      }

      if (data.session) {
        localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
        set({
          session: data.session,
          user: data.user,
          token: data.session.access_token,
          profile: {
            id: data.user.id,
            email: data.user.email || '',
            fullName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
            avatarUrl: data.user.user_metadata?.avatar_url,
          },
          isAuthenticated: true,
          isDemoUser: false,
          isLoading: false,
        });
        return { success: true };
      }

      set({ isLoading: false });
      return { success: false, error: 'Failed to retrieve session' };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err?.message || 'Login failed' };
    }
  },

  signUp: async (email, password, fullName) => {
    set({ isLoading: true });
    try {
      if (!isSupabaseConfigured()) {
        const newUser: DemoUser = {
          id: '33333333-3333-3333-3333-333333333333',
          email,
          fullName,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
          role: 'Member',
        };
        get().loginAsDemoUser(newUser);
        return { success: true };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            name: fullName,
          },
        },
      });

      if (error) {
        set({ isLoading: false });
        return { success: false, error: error.message };
      }

      if (data.session) {
        set({
          session: data.session,
          user: data.user,
          token: data.session.access_token,
          profile: {
            id: data.user!.id,
            email: data.user!.email || '',
            fullName: fullName,
          },
          isAuthenticated: true,
          isDemoUser: false,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err?.message || 'Sign up failed' };
    }
  },

  signOut: async () => {
    localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    set({
      session: null,
      user: null,
      token: null,
      profile: null,
      isAuthenticated: false,
      isDemoUser: false,
      isLoading: false,
    });
  },

  resetPassword: async (email) => {
    try {
      if (!isSupabaseConfigured()) {
        return { success: true };
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Password reset failed' };
    }
  },

  loginAsDemoUser: (demoUser: DemoUser) => {
    localStorage.setItem(LOCAL_STORAGE_DEMO_KEY, JSON.stringify(demoUser));
    set({
      profile: {
        id: demoUser.id,
        email: demoUser.email,
        fullName: demoUser.fullName,
        avatarUrl: demoUser.avatarUrl,
      },
      token: `demo-bearer-token:${demoUser.id}`,
      isAuthenticated: true,
      isDemoUser: true,
      isLoading: false,
    });
  },
}));
