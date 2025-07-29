'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './OpenRouterConnect.module.css'

export default function OpenRouterConnect() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const generateCodeChallenge = async (verifier: string) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  const generateRandomString = (length: number) => {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  const handleConnect = async () => {
    setLoading(true)
    
    try {
      // Generate PKCE parameters
      const codeVerifier = generateRandomString(64)
      const codeChallenge = await generateCodeChallenge(codeVerifier)
      
      // Store verifier in session storage for the callback
      sessionStorage.setItem('openrouter_code_verifier', codeVerifier)
      
      // Construct OpenRouter OAuth URL
      const callbackUrl = process.env.NEXT_PUBLIC_OPENROUTER_CALLBACK_URL
      console.log('Callback URL:', callbackUrl)
      console.log('Code challenge:', codeChallenge)
      
      if (!callbackUrl) {
        console.error('NEXT_PUBLIC_OPENROUTER_CALLBACK_URL is not set!')
        throw new Error('OpenRouter callback URL is not configured')
      }
      
      const params = new URLSearchParams({
        callback_url: callbackUrl,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      })
      
      const authUrl = `https://openrouter.ai/auth?${params.toString()}`
      console.log('Redirecting to:', authUrl)
      
      // Redirect to OpenRouter
      window.location.href = authUrl
    } catch (error) {
      console.error('Failed to initiate OpenRouter connection:', error)
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2>CONNECT OPENROUTER</h2>
        
        <div className={styles.info}>
          <p>To generate stories with PlotCraft, you need to connect your OpenRouter account.</p>
          
          <div className={styles.benefits}>
            <h3>Why OpenRouter?</h3>
            <ul>
              <li>Use your own API credits</li>
              <li>Access to all AI models</li>
              <li>Pay only for what you use</li>
              <li>Full transparency on costs</li>
            </ul>
          </div>
        </div>

        <button
          onClick={handleConnect}
          disabled={loading}
          className={styles.connectButton}
        >
          {loading ? 'REDIRECTING...' : 'CONNECT OPENROUTER ACCOUNT'}
        </button>

        <div className={styles.footer}>
          <p>Don't have an OpenRouter account?</p>
          <a 
            href="https://openrouter.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.link}
          >
            Sign up at OpenRouter.ai →
          </a>
        </div>
      </div>
    </div>
  )
}