import { createServerClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

function resolveStatus(sub: Stripe.Subscription): {
  subscription_status: string
  listing_status: string
} {
  const { status, cancel_at_period_end } = sub
  if (status === 'active' && cancel_at_period_end) {
    return { subscription_status: 'canceling', listing_status: 'live' }
  }
  if (status === 'active') {
    return { subscription_status: 'active', listing_status: 'live' }
  }
  if (status === 'past_due') {
    return { subscription_status: 'past_due', listing_status: 'draft' }
  }
  if (status === 'unpaid') {
    return { subscription_status: 'unpaid', listing_status: 'suspended' }
  }
  // canceled, paused, trialing, incomplete, incomplete_expired
  return { subscription_status: status, listing_status: 'draft' }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return Response.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET ?? '',
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Signature verification failed.'
    console.error('Stripe webhook signature error:', msg)
    return Response.json({ error: msg }, { status: 400 })
  }

  const supabase = createServerClient()

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const partnerId = session.metadata?.partner_id
      if (!partnerId) break
      const customerId    = typeof session.customer     === 'string' ? session.customer     : session.customer?.id ?? null
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null
      await supabase
        .from('partners')
        .update({ stripe_customer_id: customerId, stripe_subscription_id: subscriptionId })
        .eq('id', partnerId)
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const partnerId = sub.metadata?.partner_id
      if (!partnerId) break
      const { subscription_status, listing_status } = resolveStatus(sub)
      await supabase
        .from('partners')
        .update({ subscription_status, listing_status })
        .eq('id', partnerId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const partnerId = sub.metadata?.partner_id
      if (!partnerId) break
      await supabase
        .from('partners')
        .update({ subscription_status: 'canceled', listing_status: 'draft' })
        .eq('id', partnerId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      // Stripe v22: subscription is nested under invoice.parent.subscription_details.subscription
      const subField = invoice.parent?.subscription_details?.subscription
      const subscriptionId = typeof subField === 'string'
        ? subField
        : subField != null && typeof subField === 'object' && 'id' in subField
          ? (subField as { id: string }).id
          : null
      if (!subscriptionId) break
      await supabase
        .from('partners')
        .update({ subscription_status: 'past_due', listing_status: 'draft' })
        .eq('stripe_subscription_id', subscriptionId)
      break
    }

  }

  return Response.json({ received: true })
}
