import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Mock auth callback - just redirect to dashboard
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/dashboard'
  return NextResponse.redirect(`${origin}${next}`)
}

