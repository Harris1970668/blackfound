import { createAuthServerClient } from '@/lib/supabase-auth-server'

export async function POST(request: Request) {
  const { email } = await request.json()

  // Silently succeed for non-admin emails so we don't reveal what the admin address is
  if (email !== process.env.ADMIN_EMAIL) {
    return Response.json({ ok: true })
  }

  const supabase = await createAuthServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    console.error('Magic link error:', error)
    return Response.json({ error: 'Failed to send sign-in link.' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
