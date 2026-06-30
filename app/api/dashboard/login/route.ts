import { createAuthServerClient } from '@/lib/supabase-auth-server'

export async function POST(request: Request) {
  const { email, next } = await request.json()

  if (!email) {
    return Response.json({ error: 'Email is required.' }, { status: 400 })
  }

  // Build the callback URL, preserving the next destination (e.g. /dashboard/invite?token=...)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const callbackUrl = next
    ? `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`
    : `${siteUrl}/auth/callback?next=/dashboard`

  const supabase = await createAuthServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl },
  })

  if (error) {
    console.error('Partner magic link error:', error)
    return Response.json({ error: 'Failed to send sign-in link.' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
