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
  unlinkOpenRouter: () => Promise<void>
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
    // Clear localStorage
    const localStorageKeys = Object.keys(localStorage)
    localStorageKeys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key)
      }
    })
    
    // Clear sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage)
    sessionStorageKeys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        sessionStorage.removeItem(key)
      }
    })
    
    // Try to sign out globally (this might fail if not signed in, which is ok)
    try {
      await supabase.auth.signOut({ scope: 'global' })
    } catch (e) {
      // Ignore error - user might not be signed in
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
  }

  const signInWithGoogle = async () => {
    // Clear all OAuth state before starting to ensure fresh session
    await clearOAuthState()
    
    // Add a small delay to ensure clearing is complete
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Add timestamp to prevent any URL caching
    const timestamp = Date.now()
    const redirectUrl = `${window.location.origin}/auth/callback?t=${timestamp}`
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    })
    
    if (error) throw error
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

  const unlinkOpenRouter = async () => {
    if (!user) throw new Error('User not authenticated')
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')
    
    const response = await fetch('/api/auth/openrouter/unlink', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to unlink OpenRouter account')
    }
    
    // Update local state
    setHasOpenRouterKey(false)
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
        unlinkOpenRouter,
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