'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Terminal from '@/components/Terminal/Terminal'
import Logo from '@/components/Brand/Logo'
import BackgroundSwitcher from '@/components/Backgrounds/BackgroundSwitcher'
import styles from './signin.module.css'

type AuthMode = 'signin' | 'signup' | 'magiclink'

export default function SignInPage() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [statusMessages, setStatusMessages] = useState<string[]>([])
  
  const { signIn, signUp, signInWithGoogle, signInWithMagicLink, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      addStatusMessage('Authentication successful!')
      addStatusMessage('Redirecting to PlotCraft...')
      setTimeout(() => {
        router.push('/')
      }, 1500)
    }
  }, [user, router])

  const addStatusMessage = (message: string) => {
    setStatusMessages(prev => [...prev, `> ${message}`])
  }

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    
    addStatusMessage(`Initializing ${mode === 'signin' ? 'authentication' : 'registration'}...`)

    try {
      if (mode === 'signin') {
        addStatusMessage('Verifying credentials...')
        await signIn(email, password)
      } else {
        if (!username.trim()) {
          throw new Error('Username is required')
        }
        addStatusMessage('Creating new user account...')
        await signUp(email, password, username)
        setSuccess('Account created! Check your email to verify.')
        addStatusMessage('Account created successfully!')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      addStatusMessage(`ERROR: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    addStatusMessage('Initializing Google OAuth...')
    addStatusMessage('Redirecting to Google...')
    
    try {
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
      addStatusMessage(`ERROR: ${err.message}`)
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    addStatusMessage('Preparing secure link...')
    
    try {
      await signInWithMagicLink(email)
      setSuccess('Magic link sent! Check your email.')
      addStatusMessage('Magic link sent successfully!')
      addStatusMessage('Link expires in 10:00')
      setEmail('')
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link')
      addStatusMessage(`ERROR: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <BackgroundSwitcher isStreaming={false} />
      <Terminal>
        <div className={styles.container}>
          <div className={styles.logoSection}>
            <Logo variant="full" animated pulse />
          </div>

          <div className={styles.authContainer}>
            <h2 className={styles.title}>SYSTEM ACCESS REQUIRED</h2>
            
            {mode !== 'magiclink' ? (
              <form onSubmit={handleEmailPasswordSubmit} className={styles.form}>
                <div className={styles.formHeader}>
                  [{mode === 'signin' ? '1' : '2'}] {mode === 'signin' ? 'STANDARD ACCESS' : 'CREATE NEW ACCOUNT'} (Email/Password)
                </div>
                
                {mode === 'signup' && (
                  <div className={styles.inputGroup}>
                    <label htmlFor="username">Username:</label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={styles.input}
                      placeholder="enter_username"
                      disabled={loading}
                      required
                    />
                  </div>
                )}
                
                <div className={styles.inputGroup}>
                  <label htmlFor="email">Email:</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    placeholder="user@example.com"
                    disabled={loading}
                    required
                  />
                </div>
                
                <div className={styles.inputGroup}>
                  <label htmlFor="password">Password:</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    placeholder="••••••••"
                    disabled={loading}
                    required
                  />
                </div>
                
                <div className={styles.buttonGroup}>
                  <button 
                    type="submit" 
                    className={styles.primaryButton}
                    disabled={loading}
                  >
                    {loading ? 'PROCESSING...' : mode === 'signin' ? 'AUTHENTICATE' : 'CREATE ACCOUNT'}
                  </button>
                  <button 
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                    disabled={loading}
                  >
                    {mode === 'signin' ? 'CREATE ACCOUNT' : 'SIGN IN'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleMagicLink} className={styles.form}>
                <div className={styles.formHeader}>
                  [M] MAGIC LINK (Passwordless)
                </div>
                
                <div className={styles.inputGroup}>
                  <label htmlFor="magic-email">ENTER EMAIL FOR SECURE LINK:</label>
                  <input
                    id="magic-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    placeholder="user@example.com"
                    disabled={loading}
                    required
                  />
                </div>
                
                <div className={styles.buttonGroup}>
                  <button 
                    type="submit" 
                    className={styles.primaryButton}
                    disabled={loading}
                  >
                    {loading ? 'SENDING...' : 'SEND MAGIC LINK'}
                  </button>
                  <button 
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setMode('signin')}
                    disabled={loading}
                  >
                    BACK TO SIGN IN
                  </button>
                </div>
                
                {success && (
                  <div className={styles.info}>
                    &gt; Link expires in 10:00
                  </div>
                )}
              </form>
            )}
            
            <div className={styles.divider}>
              ──────────── OR CONTINUE WITH ────────────
            </div>
            
            <div className={styles.alternativeAuth}>
              <button 
                className={styles.googleButton}
                onClick={handleGoogleSignIn}
                disabled={loading}
                title="Sign in with your Google account"
              >
                <span className={styles.googleIcon}>[G]</span> GOOGLE AUTHENTICATION
              </button>
              
              {mode !== 'magiclink' && (
                <button 
                  className={styles.magicButton}
                  onClick={() => setMode('magiclink')}
                  disabled={loading}
                >
                  <span className={styles.magicIcon}>[M]</span> MAGIC LINK (Passwordless)
                </button>
              )}
            </div>
            
            {error && (
              <div className={styles.error}>
                ERROR: {error}
              </div>
            )}
            
            {success && (
              <div className={styles.success}>
                SUCCESS: {success}
              </div>
            )}
          </div>
          
          <div className={styles.statusConsole}>
            <div className={styles.statusHeader}>STATUS &gt; {loading ? 'PROCESSING' : 'AWAITING.AUTHENTICATION'}</div>
            <div className={styles.statusMessages}>
              {statusMessages.slice(-5).map((msg, index) => (
                <div key={index} className={styles.statusLine}>{msg}</div>
              ))}
              {loading && <span className={styles.cursor}>█</span>}
            </div>
          </div>
        </div>
      </Terminal>
    </>
  )
}