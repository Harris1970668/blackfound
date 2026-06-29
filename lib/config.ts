const PRICING = {
  tiers: {
    free: {
      id: 'free',
      label: 'Free / Basic',
      monthlyUsd: 0,
      annualUsd: 0,
    },
    standard: {
      id: 'standard',
      label: 'Standard Partner',
      monthlyUsd: 19,
      annualUsd: 182, // $19/mo × 12 × 0.80
    },
    featured: {
      id: 'featured',
      label: 'Featured Partner',
      monthlyUsd: 79,
      annualUsd: 758, // $79/mo × 12 × 0.80
    },
    // featured_plus: reserved for future "maximum exposure" tier.
    // Wire Stripe price and surface in UI only when explicitly enabled.
  },
  annualDiscountPercent: 20,
  cancellationNoticeDays: 30,
}

export default PRICING
