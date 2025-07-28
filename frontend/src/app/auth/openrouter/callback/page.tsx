'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function OpenRouterCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { checkOpenRouterKey } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const codeVerifier = sessionStorage.getItem('openrouter_code_verifier')

      if (!code || !codeVerifier) {
        setStatus('error')
        setError('Missing authorization code or verifier')
        return
      }

      try {
        // Exchange code for API key via our backend
        const response = await fetch('/api/auth/openrouter/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            code_verifier: codeVerifier,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('API route error:', errorData)
          throw new Error(errorData.details || 'Failed to exchange code for API key')
        }

        // Clear the verifier from session storage
        sessionStorage.removeItem('openrouter_code_verifier')

        // Check that the key was saved and wait for state update
        const hasKey = await checkOpenRouterKey()
        
        setStatus('success')
        
        // Redirect to home with a success parameter
        setTimeout(() => {
          router.push('/?openrouter=connected')
        }, 2000)
      } catch (err: any) {
        setStatus('error')
        setError(err.message || 'Failed to connect OpenRouter account')
      }
    }

    handleCallback()
  }, [searchParams])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '400px',
      }}>
        {status === 'processing' && (
          <>
            <h2>CONNECTING OPENROUTER...</h2>
            <p>Please wait while we complete the connection.</p>
            <div className="loading-animation">⚡</div>
          </>
        )}

        {status === 'success' && (
          <>
            <h2>SUCCESS!</h2>
            <p>Your OpenRouter account has been connected.</p>
            <p>Redirecting to PlotCraft...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h2>CONNECTION FAILED</h2>
            <p>{error}</p>
            <button
              onClick={() => router.push('/')}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: 'var(--terminal-green)',
                color: 'var(--terminal-bg)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              RETURN TO HOME
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        .loading-animation {
          font-size: 48px;
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  )
}