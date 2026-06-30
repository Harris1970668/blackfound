import { getCurrentUser, createAuthServerClient } from '@/lib/supabase-auth-server'
import { stripe, getStripePriceId } from '@/lib/stripe'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'Not signed in.' }, { status: 401 })

  const body = await request.json() as { interval?: string }
  const interval = body.interval
  if (interval !== 'monthly' && interval !== 'annual') {
    return Response.json({ error: 'interval must be monthly or annual.' }, { status: 400 })
  }

  const supabase = await createAuthServerClient()
  const { data: partner } = await supabase
    .from('partners')
    .select('id, pricing_tier, stripe_customer_id')
    .maybeSingle()

  if (!partner) return Response.json({ error: 'Partner record not found.' }, { status: 404 })

  if (partner.pricing_tier === 'free') {
    return Response.json({ error: 'Free tier does not require billing.' }, { status: 400 })
  }

  let priceId: string
  try {
    priceId = getStripePriceId(partner.pricing_tier, interval)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Price ID not configured.'
    return Response.json({ error: msg }, { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    ...(partner.stripe_customer_id
      ? { customer: partner.stripe_customer_id }
      : { customer_email: user.email ?? undefined }),
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { partner_id: partner.id },
    subscription_data: { metadata: { partner_id: partner.id } },
    success_url: `${siteUrl}/dashboard?checkout=success`,
    cancel_url:  `${siteUrl}/dashboard?checkout=canceled`,
  })

  return Response.json({ url: session.url })
}
