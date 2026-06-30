import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

const PRICE_IDS: Record<string, Record<string, string>> = {
  standard: {
    monthly: process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID ?? '',
    annual:  process.env.STRIPE_STANDARD_ANNUAL_PRICE_ID  ?? '',
  },
  featured: {
    monthly: process.env.STRIPE_FEATURED_MONTHLY_PRICE_ID ?? '',
    annual:  process.env.STRIPE_FEATURED_ANNUAL_PRICE_ID  ?? '',
  },
  // featured_plus: reserved — wire price IDs and add entry here when enabling
}

export function getStripePriceId(tier: string, interval: 'monthly' | 'annual'): string {
  const ids = PRICE_IDS[tier]
  if (!ids) throw new Error(`No Stripe prices configured for tier: ${tier}`)
  const id = ids[interval]
  if (!id) throw new Error(`STRIPE_${tier.toUpperCase()}_${interval.toUpperCase()}_PRICE_ID is not set`)
  return id
}
