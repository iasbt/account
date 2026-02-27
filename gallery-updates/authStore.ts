import { create } from 'zustand';
import { api } from '@/lib/api';
import { User, getStoredUser, setStoredUser, getStoredToken, setStoredToken, getRefreshToken, clearAuth, isTokenExpired } from '@/lib/auth-utils';
import { usePreferenceStore } from '@/store/preferenceStore';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  hasAcceptedTerms: boolean;
  hasSeenOnboarding: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setHasAcceptedTerms: (accepted: boolean) => void;
  setHasSeenOnboarding: (seen: boolean) => Promise<void>;
  initialize: () => Promise<void>;
  checkConsentStatus: () => Promise<void>;
  acceptUploadTerms: () => Promise<void>;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,
  hasAcceptedTerms: false,
  hasSeenOnboarding: false,
  
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setHasAcceptedTerms: (accepted) => set({ hasAcceptedTerms: accepted }),
  
  setHasSeenOnboarding: async (seen) => {
    set({ hasSeenOnboarding: seen });
    const { user } = get();
    if (user) {
      try {
        await api.post('/user/onboarding', { seen });
      } catch (err) {
        console.warn('Failed to update onboarding status:', err);
      }
    }
  },
  
  checkConsentStatus: async () => {
    const { user } = get();
    if (!user) {
      set({ hasAcceptedTerms: false, hasSeenOnboarding: false });
      return;
    }
    
    try {
      const { data } = await api.get('/user/preferences');
      if (data) {
        set({ 
          hasAcceptedTerms: data.hasAcceptedTerms || false,
          hasSeenOnboarding: data.hasSeenOnboarding || false 
        });
        
        if (Array.isArray(data.categoryOrder)) {
          usePreferenceStore.getState().setCategoryOrder(data.categoryOrder);
        }
        if (Array.isArray(data.hiddenCategoryIds)) {
          usePreferenceStore.getState().setHiddenCategoryIds(data.hiddenCategoryIds);
        }
      }
    } catch (err) {
      console.warn('Failed to check user status:', err);
    }
  },
  
  acceptUploadTerms: async () => {
    const { user } = get();
    if (!user) return;
    try {
      await api.post('/user/consent', { type: 'upload_terms' });
      set({ hasAcceptedTerms: true });
    } catch (err) {
      console.error('Failed to accept upload terms:', err);
      throw err;
    }
  },
  
  initialize: async () => {
    if (get().initialized) return;
    
    set({ loading: true });
    try {
      const token = getStoredToken();
      const refreshToken = getRefreshToken();
      let user = getStoredUser();
      
      // Check if token is valid OR if we have a refresh token
      if (token && (!isTokenExpired(token) || refreshToken)) {
        if (user) {
          set({ user });
        }
        
        try {
          // If token is expired but we have refresh token, the api interceptor 
          // will handle the refresh automatically when we make this request
          const { data } = await api.get('/auth/me');
          const freshUser = data.user || data;
          
          user = freshUser;
          setStoredUser(freshUser);
          set({ user: freshUser });
          
          await get().checkConsentStatus();
        } catch (error) {
          console.warn('Token validation failed:', error);
          clearAuth();
          set({ user: null });
        }
      } else {
        clearAuth();
        set({ user: null });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ user: null });
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  login: async (token: string) => {
    setStoredToken(token);
    try {
      const { data } = await api.get('/auth/me');
      const user = data.user || data;
      setStoredUser(user);
      set({ user });
      await get().checkConsentStatus();
    } catch (error) {
      console.error('Login validation failed:', error);
      clearAuth();
      throw error;
    }
  },

  logout: async () => {
    try {
      // Optional: Call backend logout if needed
      // await api.post('/auth/logout'); 
    } catch (err) {
      console.warn('Logout warning:', err);
    } finally {
      clearAuth();
      set({ 
        user: null, 
        hasAcceptedTerms: false, 
        hasSeenOnboarding: false 
      });
      usePreferenceStore.getState().reset();
    }
  }
}));
