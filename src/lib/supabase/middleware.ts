import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Mock middleware - allow all routes for frontend-only development
  return NextResponse.next({
    request,
  })
}

