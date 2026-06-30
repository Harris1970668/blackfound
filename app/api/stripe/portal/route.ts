import { getCurrentUser, createAuthServerClient } from '@/lib/supabase-auth-server'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'Not signed in.' }, { status: 401 })

  const supabase = await createAuthServerClient()
  const { data: partner } = await supabase
    .from('partners')
    .select('stripe_customer_id')
    .maybeSingle()

  if (!partner?.stripe_customer_id) {
    return Response.json({ error: 'No billing account found.' }, { status: 404 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer: partner.stripe_customer_id,
    return_url: `${siteUrl}/dashboard`,
  })

  return Response.json({ url: session.url })
}
