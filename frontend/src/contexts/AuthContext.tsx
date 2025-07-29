'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithMagicLink: (email: string) => Promise<void>
  signOut: () => Promise<void>
  hasOpenRouterKey: boolean
  checkOpenRouterKey: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasOpenRouterKey, setHasOpenRouterKey] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        // Pass the user directly to ensure we have the correct user ID
        checkOpenRouterKeyForUser(session.user)
      }
      setLoading(false)
    })

    // Listen for changes on auth state (sign in, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        // Pass the user directly to ensure we have the correct user ID
        checkOpenRouterKeyForUser(session.user)
      } else {
        setHasOpenRouterKey(false)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkOpenRouterKeyForUser = async (currentUser: User) => {
    if (!currentUser) {
      setHasOpenRouterKey(false)
      return false
    }

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('provider', 'openrouter')
      .eq('is_active', true)
      .single()

    const hasKey = !error && !!data
    setHasOpenRouterKey(hasKey)
    return hasKey
  }

  const checkOpenRouterKey = async () => {
    if (!user) {
      setHasOpenRouterKey(false)
      return false
    }
    return checkOpenRouterKeyForUser(user)
  }

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: username,
        },
      },
    })

    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
  }

  // Helper function to clear all OAuth state
  const clearOAuthState = async () => {
    console.log('=== Clearing OAuth State ===')
    
    // Clear localStorage
    const localStorageKeys = Object.keys(localStorage)
    localStorageKeys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        console.log('Removing localStorage:', key)
        localStorage.removeItem(key)
      }
    })
    
    // Clear sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage)
    sessionStorageKeys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        console.log('Removing sessionStorage:', key)
        sessionStorage.removeItem(key)
      }
    })
    
    // Try to sign out globally (this might fail if not signed in, which is ok)
    try {
      await supabase.auth.signOut({ scope: 'global' })
      console.log('Global sign out completed')
    } catch (e) {
      console.log('Sign out skipped (probably not signed in):', e)
    }
    
    // Clear any cookies we can access (limited by browser security)
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      if (name.includes('sb-') || name.includes('supabase')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.supabase.co`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.railway.app`
      }
    })
    
    console.log('OAuth state clearing completed')
  }

  const signInWithGoogle = async () => {
    console.log('=== Google OAuth Debug ===')
    console.log('Current origin:', window.location.origin)
    console.log('Current href:', window.location.href)
    
    // Clear all OAuth state before starting
    await clearOAuthState()
    
    // Add a small delay to ensure clearing is complete
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Add timestamp to prevent any URL caching
    const timestamp = Date.now()
    const redirectUrl = `${window.location.origin}/auth/callback?t=${timestamp}`
    console.log('Redirect URL being sent:', redirectUrl)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true, // Temporarily skip auto-redirect to inspect URL
      },
    })
    
    if (error) {
      console.error('OAuth error:', error)
      throw error
    }
    
    if (data?.url) {
      console.log('OAuth URL from Supabase:', data.url)
      
      // Parse the URL to check for redirect_uri parameter
      try {
        const oauthUrl = new URL(data.url)
        const redirectUri = oauthUrl.searchParams.get('redirect_uri')
        console.log('Redirect URI in OAuth URL:', redirectUri)
        
        // Check state parameter
        const state = oauthUrl.searchParams.get('state')
        if (state) {
          console.log('OAuth state parameter:', state)
          try {
            // State might be base64 encoded
            const decodedState = atob(state)
            console.log('Decoded state:', decodedState)
          } catch (e) {
            console.log('Could not decode state (not base64)')
          }
        }
      } catch (e) {
        console.error('Error parsing OAuth URL:', e)
      }
      
      // Show the URL in an alert for easy copying
      alert(`OAuth URL (check console for details):\n\n${data.url}\n\nClick OK to proceed with sign in.`)
      
      // Manually redirect after debugging
      window.location.href = data.url
    }
  }

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    router.push('/')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithMagicLink,
        signOut,
        hasOpenRouterKey,
        checkOpenRouterKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}