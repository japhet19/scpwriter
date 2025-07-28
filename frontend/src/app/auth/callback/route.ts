import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${requestUrl.origin}/signin?error=auth_callback_error`)
    }
    
    // Check if user has OpenRouter key to determine redirect
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: hasKey } = await supabase
        .from('user_api_keys')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'openrouter')
        .eq('is_active', true)
        .single()
      
      // Redirect to home if has key, otherwise will show OpenRouter connect
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }
  }

  // Return to signin if no code
  return NextResponse.redirect(`${requestUrl.origin}/signin`)
}