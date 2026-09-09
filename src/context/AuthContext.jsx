import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const AuthContext = createContext();

export const LOCAL_USERS_KEY = 'transitflow_local_users';
export const LOCAL_SESSION_KEY = 'transitflow_local_session';
export const ADMIN_EMAILS = ['nkengsteadbeks@gmail.com', 'admin@transitflow.com'];

export const isAdminEmail = (email) => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(normalized);
};

export const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const getLocalUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveLocalUsers = (users) => localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session and auth state listener
  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        const savedSession = localStorage.getItem(LOCAL_SESSION_KEY);
        if (savedSession) setCurrentUser(JSON.parse(savedSession));
      } catch {}
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const email = session.user.email || '';
        const rawName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0];
        const role = isAdminEmail(email) ? 'admin' : (session.user.user_metadata?.role || 'passenger');
        const avatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null;
        
        let profileName = rawName;
        try {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (profile?.name) profileName = profile.name;
        } catch (e) {}

        const authUser = {
          id: session.user.id,
          email,
          name: profileName,
          role,
          avatar
        };
        setCurrentUser(authUser);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(authUser));
      } else {
        const savedSession = localStorage.getItem(LOCAL_SESSION_KEY);
        if (savedSession) {
          try { setCurrentUser(JSON.parse(savedSession)); } catch {}
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const email = session.user.email || '';
        const rawName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0];
        const role = isAdminEmail(email) ? 'admin' : (session.user.user_metadata?.role || 'passenger');
        const avatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null;
        
        let profileName = rawName;
        try {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (profile) {
            profileName = profile.name || rawName;
          } else {
            // Automatically insert newly registered Google OAuth user into public.profiles
            await supabase.from('profiles').upsert({
              id: session.user.id,
              name: rawName,
              email: email,
              role: role,
              avatar_url: avatar
            });
          }
        } catch (e) {
          console.warn('Profile sync warning:', e);
        }

        const authUser = {
          id: session.user.id,
          email: email,
          name: profileName,
          role,
          avatar
        };
        setCurrentUser(authUser);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(authUser));
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem(LOCAL_SESSION_KEY);
        setCurrentUser(null);
      } else {
        const savedSession = localStorage.getItem(LOCAL_SESSION_KEY);
        if (savedSession) {
          try { setCurrentUser(JSON.parse(savedSession)); } catch {}
        } else {
          setCurrentUser(null);
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const registerUser = async (name, email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const targetRole = isAdminEmail(normalizedEmail) ? 'admin' : 'passenger';

    const users = getLocalUsers();
    const existingIndex = users.findIndex(u => u.email === normalizedEmail);
    const localUser = {
      id: `local-${Date.now()}`,
      email: normalizedEmail,
      name,
      password,
      role: targetRole
    };

    if (existingIndex >= 0) {
      users[existingIndex] = localUser;
    } else {
      users.push(localUser);
    }
    saveLocalUsers(users);

    if (!isSupabaseConfigured) {
      return { success: true, user: localUser };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name,
            role: targetRole
          }
        }
      });

      if (error) {
        console.warn('Supabase signup warning:', error.message);
        if (error.message.includes('rate limit') || error.message.includes('already registered')) {
          return { success: true, user: localUser };
        }
        return { success: false, message: error.message };
      }
      return { success: true, user: data.user || localUser };
    } catch (err) {
      console.warn('Supabase auth fallback:', err.message);
      return { success: true, user: localUser };
    }
  };

  const loginUser = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const localUser = getLocalUsers().find(
      savedUser => savedUser.email === normalizedEmail && savedUser.password === password
    );

    if (!isSupabaseConfigured) {
      if (!localUser) {
        return { success: false, message: 'Invalid email or password.' };
      }

      const sessionUser = {
        id: localUser.id,
        email: localUser.email,
        name: localUser.name,
        role: isAdminEmail(localUser.email) ? 'admin' : localUser.role
      };
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(sessionUser));
      setCurrentUser(sessionUser);
      return { success: true, user: sessionUser };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (error) {
        if (localUser) {
          const sessionUser = {
            id: localUser.id,
            email: localUser.email,
            name: localUser.name,
            role: isAdminEmail(localUser.email) ? 'admin' : localUser.role
          };
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(sessionUser));
          setCurrentUser(sessionUser);
          return { success: true, user: sessionUser };
        }
        const friendlyMessage = (error.message?.toLowerCase().includes('invalid login credentials') || error.message?.toLowerCase().includes('invalid_grant'))
          ? 'Invalid email or password. Please check your credentials or create a new account.'
          : error.message;
        return { success: false, message: friendlyMessage };
      }

      const role = isAdminEmail(data.user?.email) ? 'admin' : (data.user?.user_metadata?.role || 'passenger');
      const authUser = { ...data.user, role };
      setCurrentUser(authUser);
      return { success: true, user: authUser };
    } catch (err) {
      if (localUser) {
        const sessionUser = {
          id: localUser.id,
          email: localUser.email,
          name: localUser.name,
          role: isAdminEmail(localUser.email) ? 'admin' : localUser.role
        };
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(sessionUser));
        setCurrentUser(sessionUser);
        return { success: true, user: sessionUser };
      }
      return { success: false, message: err.message || 'Login error' };
    }
  };

  const loginWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      // Offline / demo environment fallback: authenticate smoothly as demo Google user
      const demoEmail = 'passenger.google@gmail.com';
      const demoName = 'Google Passenger';
      const localUser = {
        id: `google-local-${Date.now()}`,
        email: demoEmail,
        name: demoName,
        role: isAdminEmail(demoEmail) ? 'admin' : 'passenger',
        provider: 'google'
      };

      const users = getLocalUsers();
      const existingIndex = users.findIndex(u => u.email === demoEmail);
      if (existingIndex >= 0) {
        users[existingIndex] = { ...users[existingIndex], ...localUser };
      } else {
        users.push(localUser);
      }
      saveLocalUsers(users);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localUser));
      setCurrentUser(localUser);
      return { success: true, user: localUser };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Google OAuth Error:', err);
      return { success: false, message: err.message || 'Google sign-in error' };
    }
  };

  const logoutUser = async () => {
    if (isSupabaseConfigured) {
      try { await supabase.auth.signOut(); } catch {}
    }
    localStorage.removeItem(LOCAL_SESSION_KEY);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        registerUser,
        loginUser,
        loginWithGoogle,
        logoutUser,
        isAdminEmail
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
