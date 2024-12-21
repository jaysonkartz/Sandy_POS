import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createMiddlewareClient(
    { req: request, res: supabaseResponse }
  )

  // refreshing the auth token
  await supabase.auth.getUser()

  return supabaseResponse
}