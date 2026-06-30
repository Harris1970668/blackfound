import { createServerClient } from '@/lib/supabase-server'
import { getAdminUser, isAdmin } from '@/lib/supabase-auth-server'
import { sendDeclineEmail } from '@/lib/resend'

export async function POST(request: Request) {
  const user = await getAdminUser()
  if (!user || !isAdmin(user.email)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { application_id } = await request.json()
  if (!application_id) {
    return Response.json({ error: 'application_id required' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: app, error: appError } = await supabase
    .from('partner_applications')
    .select('builder_name, contact_email, app_name')
    .eq('id', application_id)
    .eq('status', 'pending')
    .single()

  if (appError || !app) {
    return Response.json({ error: 'Application not found or already actioned.' }, { status: 404 })
  }

  await supabase
    .from('partner_applications')
    .update({ status: 'declined' })
    .eq('id', application_id)

  sendDeclineEmail({
    builder_name: app.builder_name,
    to_email: app.contact_email,
    app_name: app.app_name,
  }).catch(err => console.error('Decline email failed:', err))

  return Response.json({ ok: true })
}
