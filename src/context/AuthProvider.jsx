import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Synchronously check for session in localStorage to prevent "waiting for supabase" flicker
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (projectId) {
      const storageKey = `sb-${projectId}-auth-token`;
      const saved = localStorage.getItem(storageKey);
      try {
        return saved ? JSON.parse(saved).user : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [profile, setProfile] = useState(() => {
    // Initial load from localStorage to prevent UI flash
    const saved = localStorage.getItem('roaster_profile');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    // If we have a user in state already, we don't need to show the full-page loader
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (projectId) {
      return !localStorage.getItem(`sb-${projectId}-auth-token`);
    }
    return true;
  });

  const fetchProfile = useCallback(async (userId, userEmail) => {
    if (!userId || !supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Profile fetch error from Supabase:', error);
        console.log('Error details:', { code: error.code, message: error.message, hint: error.hint });
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userEmail,
              display_name: userEmail ? userEmail.split('@')[0] : 'Agent',
              role: 'user'
            })
            .select()
            .single();
            
          if (!insertError) {
            setProfile(newProfile);
            localStorage.setItem('roaster_profile', JSON.stringify(newProfile));
          }
        }
      } else if (data) {
        console.log('Profile successfully fetched:', data);
        setProfile(data);
        localStorage.setItem('roaster_profile', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }, []);

  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    console.log('Initiating logout...');
    
    // Clear local state IMMEDIATELY so the UI responds
    setUser(null);
    setProfile(null);
    
    // Aggressively clear localStorage
    localStorage.removeItem('roaster_profile');
    
    // Clear all Supabase and app-related keys in localStorage
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('auth-token') || key === 'bureau_settings' || key === 'roaster_profile') {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Error clearing localStorage keys:', e);
    }
    
    console.log('Local auth state and storage cleared.');

    try {
      if (supabase) {
        // Call Supabase signOut but don't let it block the UI if it's slow
        await Promise.race([
          supabase.auth.signOut({ scope: 'local' }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('SignOut timeout')), 2000))
        ]).catch(err => console.warn('Supabase signOut background error/timeout:', err));
      }
    } catch (err) {
      console.error('Logout background error:', err);
    }
    console.log('Logout process completed.');
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;
    let authCheckComplete = false;

    // Subscribe to auth state changes - this is the source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isSubscribed) return;

        const currentUser = session?.user ?? null;
        console.log('Auth state change detected:', { event: _event, userId: currentUser?.id });

        if (!currentUser) {
          // No user - logged out
          setUser(null);
          setProfile(null);
          localStorage.removeItem('roaster_profile');
          setLoading(false);
          authCheckComplete = true;
        } else {
          // User exists
          setUser(currentUser);
          
          // Fetch profile on sign-in or initial load
          if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION' || !authCheckComplete) {
            await fetchProfile(currentUser.id, currentUser.email);
          }
          
          if (!authCheckComplete) {
            authCheckComplete = true;
          }
        }
      }
    );

    // Explicitly check for initial session to avoid the "timeout" issue
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isSubscribed && !authCheckComplete && session) {
        console.log('Initial session found via getSession()');
        const currentUser = session.user;
        setUser(currentUser);
        fetchProfile(currentUser.id, currentUser.email);
        authCheckComplete = true;
      }
    });

    // Add a fallback timeout in case auth never completes
    const fallbackTimer = setTimeout(() => {
      if (isSubscribed && !authCheckComplete) {
        console.warn('Auth check timeout - no session found');
        setLoading(false);
        authCheckComplete = true;
      }
    }, 3000);

    return () => {
      isSubscribed = false;
      clearTimeout(fallbackTimer);
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Hardened Admin check with email fallback
  const isAdmin = useMemo(() => {
    if (profile?.role === 'admin') return true;
    // Emergency fallback for the main admin email
    if (user?.email === 'ceejayibabiosa@gmail.com') return true;
    return false;
  }, [profile, user]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut
  }), [user, profile, loading, isAdmin, signIn, signUp, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
