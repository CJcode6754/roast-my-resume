import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  // Start with no user - let onAuthStateChange restore it
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(() => {
    // Initial load from localStorage to prevent UI flash
    const saved = localStorage.getItem('roaster_profile');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId, userEmail) => {
    if (!userId || !supabase) {
      console.warn('Cannot fetch profile: userId or supabase missing');
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
        console.error('❌ Profile fetch error:', error);
        console.error('Error code:', error.code, 'Message:', error.message);
        
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
          } else {
            console.error('Failed to create profile:', insertError);
          }
        }
      } else if (data) {
        setProfile(data);
        localStorage.setItem('roaster_profile', JSON.stringify(data));
      }
    } catch (err) {
      console.error('❌ Unexpected error in fetchProfile:', err);
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
    // Clear local state IMMEDIATELY so the UI responds
    setUser(null);
    setProfile(null);
    
    // Clear all known Supabase and app-related keys from localStorage
    const keysToAlwaysRemove = [
      'roaster_profile',
      'bureau_settings'
    ];
    
    keysToAlwaysRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Also remove any old-style keys or other auth-related keys that might exist
    try {
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (
          key.startsWith('sb-') ||
          key.includes('supabase') ||
          key.includes('auth-token') ||
          key.includes('auth')
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Error clearing localStorage keys:', e);
    }

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
            fetchProfile(currentUser.id, currentUser.email); // Removed await to prevent Supabase deadlock
          }
          
          if (!authCheckComplete) {
            authCheckComplete = true;
          }
        }
      }
    );


    
    // Set a longer timeout as safety net
    const fallbackTimer = setTimeout(() => {
      if (isSubscribed && !authCheckComplete) {
        console.warn('⚠️ Auth state listener did not fire within 8 seconds - forcing completion');
        setLoading(false);
        authCheckComplete = true;
      }
    }, 8000);

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
