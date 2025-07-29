import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  // Get the correct origin, accounting for proxies/load balancers
  // Railway (and other platforms) set x-forwarded-host with the actual public hostname
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  
  // Use the forwarded host if available, otherwise fall back to the Host header
  // This prevents using the internal container URL (localhost:8080)
  const origin = forwardedHost 
    ? `${forwardedProto}://${forwardedHost}`
    : `${forwardedProto}://${request.headers.get('host')}`

  if (code) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${origin}/signin?error=auth_callback_error`)
    }
    
    // Redirect to home after successful authentication
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Check if user has OpenRouter key (for future use if needed)
      await supabase
        .from('user_api_keys')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'openrouter')
        .eq('is_active', true)
        .single()
      
      // Redirect to home - the page will check for OpenRouter key and show appropriate UI
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to signin if no code
  return NextResponse.redirect(`${origin}/signin`)
}