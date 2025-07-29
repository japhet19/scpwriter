import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { code, code_verifier } = await request.json()

    if (!code || !code_verifier) {
      return NextResponse.json(
        { error: 'Missing code or code_verifier' },
        { status: 400 }
      )
    }

    // Get the authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Exchange code for API key with OpenRouter
    console.log('Exchanging code with OpenRouter API')
    const openRouterUrl = 'https://openrouter.ai/api/v1/auth/keys'
    console.log('OpenRouter URL:', openRouterUrl)
    
    const tokenResponse = await fetch(openRouterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        code_verifier,
        code_challenge_method: 'S256',
      }),
    })
    
    console.log('OpenRouter response status:', tokenResponse.status)
    console.log('OpenRouter response headers:', Object.fromEntries(tokenResponse.headers.entries()))

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('OpenRouter token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
        request: {
          code: code?.substring(0, 10) + '...',
          code_verifier: code_verifier?.substring(0, 10) + '...'
        }
      })
      return NextResponse.json(
        { 
          error: 'Failed to exchange code for API key',
          details: errorData,
          status: tokenResponse.status
        },
        { status: 400 }
      )
    }

    const { key } = await tokenResponse.json()
    console.log('Got API key from OpenRouter:', key ? 'Key received' : 'No key received')

    // Call the backend to encrypt and store the key
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/openrouter/store-key`
    console.log('Calling backend URL:', backendUrl)
    
    const session = await supabase.auth.getSession()
    console.log('Session exists:', !!session.data.session)
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.data.session?.access_token}`,
      },
      body: JSON.stringify({
        api_key: key,
      }),
    })
    
    console.log('Backend response status:', backendResponse.status)

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text()
      console.error('Failed to store API key:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        body: errorData,
        url: backendUrl
      })
      return NextResponse.json(
        { error: 'Failed to store API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('OpenRouter callback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}