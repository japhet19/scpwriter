import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get the user's session token
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      )
    }

    // Call the backend to unlink OpenRouter
    console.log('Calling backend to unlink OpenRouter for user:', user.id)
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/openrouter/key`
    console.log('Backend URL:', backendUrl)
    
    const backendResponse = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    console.log('Backend response status:', backendResponse.status)

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json()
      console.error('Backend error response:', errorData)
      return NextResponse.json(
        { error: errorData.detail || 'Failed to unlink OpenRouter account' },
        { status: backendResponse.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('OpenRouter unlink error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}