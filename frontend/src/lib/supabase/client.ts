import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Explicitly set the redirect URL to prevent any localhost defaults
        redirectTo: typeof window !== 'undefined' 
          ? `${window.location.origin}/auth/callback`
          : 'https://plotcraft.up.railway.app/auth/callback',
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  )
}