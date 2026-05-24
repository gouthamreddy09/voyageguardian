import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseReady } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseReady || !supabase) {
      setLoading(false);
      return;
    }

    // Get initial session with error handling
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        // Clear any stale session data if no valid session exists
        if (!session) {
          supabase.auth.signOut().catch(() => {
            // Ignore signOut errors when there's no session
          });
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to get initial session:', error);
        setUser(null);
        setLoading(false);
      });

    // Listen for auth changes with error handling
    let subscription;
    try {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      subscription = authSubscription;
    } catch (error) {
      console.error('Failed to set up auth state listener:', error);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isSupabaseReady]);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseReady || !supabase) {
      return { error: { message: 'Authentication service is not configured. Please set up Supabase environment variables.' } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseReady || !supabase) {
      return { error: { message: 'Authentication service is not configured. Please set up Supabase environment variables.' } };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    if (!isSupabaseReady || !supabase) {
      return { error: null };
    }

    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseReady || !supabase) {
      return { error: { message: 'Authentication service is not configured. Please set up Supabase environment variables.' } };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    return { data, error };
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseReady || !supabase) {
      return { error: { message: 'Authentication service is not configured. Please set up Supabase environment variables.' } };
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { data, error };
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    isSupabaseConfigured: isSupabaseReady
  };
}