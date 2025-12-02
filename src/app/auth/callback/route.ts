import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/dashboard'

  // Handle OAuth errors from provider
  if (error) {
    console.error('OAuth provider error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`
    )
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=${encodeURIComponent(exchangeError.message)}&type=exchange`
      )
    }
  }

  // No code and no error - something went wrong
  return NextResponse.redirect(
    `${origin}/auth/auth-code-error?error=no_code_received`
  )
}

