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

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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