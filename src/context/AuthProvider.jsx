import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Dynamically get the project ID from the environment URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    const storageKey = projectId ? `sb-${projectId}-auth-token` : null;
    
    if (storageKey) {
      const sessionStr = localStorage.getItem(storageKey);
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          return session?.user ?? null;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });
  
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('roaster_profile');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchProfile(currentUser.id, currentUser.email);
        } else {
          setProfile(null);
          localStorage.removeItem('roaster_profile');
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId, userEmail) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Profile is missing! Auto-create it to fix the issue.
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
      } else if (!error && data) {
        setProfile(data);
        localStorage.setItem('roaster_profile', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
