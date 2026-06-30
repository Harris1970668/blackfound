import { createServerClient } from '@/lib/supabase-server'
import { getCurrentUser } from '@/lib/supabase-auth-server'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ error: 'Not signed in.' }, { status: 401 })
  }

  const { token } = await request.json()
  if (!token) {
    return Response.json({ error: 'Token is required.' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Validate the invite token
  const { data: invite, error: inviteError } = await supabase
    .from('dashboard_invites')
    .select('id, partner_id, expires_at, used_at')
    .eq('token', token)
    .single()

  if (inviteError || !invite) {
    return Response.json({ error: 'Invite link is invalid.' }, { status: 404 })
  }

  if (invite.used_at) {
    return Response.json({ error: 'This invite link has already been used.' }, { status: 409 })
  }

  if (new Date(invite.expires_at) < new Date()) {
    return Response.json({ error: 'This invite link has expired. Please contact BlackFound for a new one.' }, { status: 410 })
  }

  // Link the partner row to this user
  const { error: partnerError } = await supabase
    .from('partners')
    .update({ owner_user_id: user.id })
    .eq('id', invite.partner_id)

  if (partnerError) {
    console.error('Partner link error:', partnerError)
    return Response.json({ error: 'Failed to claim invite. Please try again.' }, { status: 500 })
  }

  // Mark the invite as used so it cannot be reused
  await supabase
    .from('dashboard_invites')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invite.id)

  return Response.json({ ok: true })
}
