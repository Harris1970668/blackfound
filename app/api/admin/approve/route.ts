import { createServerClient } from '@/lib/supabase-server'
import { getAdminUser, isAdmin } from '@/lib/supabase-auth-server'
import { sendApprovalEmail } from '@/lib/resend'
import { randomUUID } from 'crypto'

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

  // Fetch the application — re-verify it is still pending server-side
  const { data: app, error: appError } = await supabase
    .from('partner_applications')
    .select('*')
    .eq('id', application_id)
    .eq('status', 'pending')
    .single()

  if (appError || !app) {
    return Response.json({ error: 'Application not found or already actioned.' }, { status: 404 })
  }

  // Free-tier partners go live immediately; paid tiers stay draft until Stripe checkout
  const listingStatus = app.requested_tier === 'free' ? 'live' : 'draft'

  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .insert({
      application_id: app.id,
      owner_user_id: null,
      app_name: app.app_name,
      tagline: app.tagline,
      description_long: app.description_long ?? null,
      problem_solved: app.problem_solved ?? null,
      app_audience: app.app_audience ?? null,
      app_url: app.app_url,
      category: app.category,
      subcategory: app.subcategory ?? null,
      tags: app.tags ?? [],
      platform: app.platform ?? null,
      pricing_model: app.pricing_model ?? null,
      app_status: app.app_status ?? null,
      pricing_tier: app.requested_tier,
      listing_status: listingStatus,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: null,
    })
    .select('id')
    .single()

  if (partnerError || !partner) {
    console.error('Partner insert error:', partnerError)
    return Response.json({ error: 'Failed to create partner record.' }, { status: 500 })
  }

  // Generate a single-use invite token valid for 7 days
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error: inviteError } = await supabase
    .from('dashboard_invites')
    .insert({ partner_id: partner.id, token, expires_at: expiresAt, used_at: null })

  if (inviteError) {
    console.error('Invite insert error:', inviteError)
    return Response.json({ error: 'Failed to create invite token.' }, { status: 500 })
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/invite?token=${token}`

  sendApprovalEmail({
    builder_name: app.builder_name,
    to_email: app.contact_email,
    app_name: app.app_name,
    invite_url: inviteUrl,
  }).catch(err => console.error('Approval email failed:', err))

  // Mark application approved so it leaves the queue
  await supabase
    .from('partner_applications')
    .update({ status: 'approved' })
    .eq('id', application_id)

  return Response.json({ ok: true, listing_status: listingStatus })
}
