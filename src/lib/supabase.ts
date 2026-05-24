import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey !== 'placeholder-key' &&
  supabaseUrl.includes('.supabase.co');

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase is not properly configured. Please set up your environment variables:');
  console.warn('1. Copy .env.example to .env');
  console.warn('2. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from https://app.supabase.com');
  console.warn('3. Authentication features will be disabled until configured.');
}

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: (url, options = {}) => {
      // Convert Headers object to plain object if needed
      const headers = options.headers instanceof Headers 
        ? Object.fromEntries(options.headers.entries())
        : options.headers || {};

      return fetch(url, {
        ...options,
        headers: {
          ...headers,
          'apikey': supabaseAnonKey,
          'x-client-info': 'supabase-js-web'
        }
      }).then(async response => {
        // Check for refresh token errors
        if (!response.ok && response.status === 400 && url.includes('/auth/v1/token')) {
          try {
            const errorBody = await response.clone().text();
            if (errorBody.includes('refresh_token_not_found') || errorBody.includes('Invalid Refresh Token')) {
              console.warn('Stale refresh token detected, clearing session and reloading...');
              
              // Clear all Supabase-related data from localStorage
              const keysToRemove = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('sb-')) {
                  keysToRemove.push(key);
                }
              }
              keysToRemove.forEach(key => localStorage.removeItem(key));
              
              // Reload the page to reinitialize auth state
              window.location.reload();
              return response;
            }
          } catch (parseError) {
            // If we can't parse the error, continue with normal error handling
          }
        }
        
        return response;
      }).catch(error => {
        console.error('Supabase fetch error:', error);
        throw new Error('Failed to connect to Supabase. Please check your internet connection and Supabase configuration.');
      });
    }
  }
}) : null;

// Export configuration status for components to check
export const isSupabaseReady = isSupabaseConfigured;