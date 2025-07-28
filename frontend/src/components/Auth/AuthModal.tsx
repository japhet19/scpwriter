'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import styles from './AuthModal.module.css'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        if (!username.trim()) {
          throw new Error('Username is required')
        }
        await signUp(email, password, username)
      }
      onSuccess?.()
      onClose()
      // Reset form
      setEmail('')
      setPassword('')
      setUsername('')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'signup' && (
            <div className={styles.field}>
              <label htmlFor="username">USERNAME</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required={mode === 'signup'}
                disabled={loading}
              />
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email">EMAIL</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">PASSWORD</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'PROCESSING...' : mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className={styles.footer}>
          {mode === 'signin' ? (
            <p>
              Don't have an account?{' '}
              <button 
                onClick={() => {
                  setMode('signup')
                  setError('')
                }}
                className={styles.switchButton}
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button 
                onClick={() => {
                  setMode('signin')
                  setError('')
                }}
                className={styles.switchButton}
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}