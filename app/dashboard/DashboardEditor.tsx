'use client'

import { useState, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import PRICING from '@/lib/config'
import s from './dashboard.module.css'

const CATEGORIES = [
  'Analytics & Data', 'Business & Operations', 'Communication', 'Creative Tools',
  'Developer Tools', 'E-commerce & Retail', 'Education & Learning', 'Finance & Money',
  'Health & Fitness', 'Marketing & Growth', 'Productivity', 'Other',
]

type Partner = {
  id: string
  app_name: string
  tagline: string | null
  app_url: string
  description_long: string | null
  problem_solved: string | null
  app_audience: string | null
  tags: string[] | null
  category: string
  subcategory: string | null
  platform: string | null
  pricing_model: string | null
  app_status: string | null
  listing_status: string
  pricing_tier: string
  stripe_customer_id: string | null
  subscription_status: string | null
}

type EditState = {
  app_name: string
  tagline: string
  app_url: string
  description_long: string
  problem_solved: string
  app_audience: string
  category: string
  subcategory: string
  platform: string
  pricing_model: string
  app_status: string
}

function statusClass(s_: string, styles: typeof s) {
  if (s_ === 'live') return styles.statusLive
  if (s_ === 'draft') return styles.statusDraft
  if (s_ === 'suspended') return styles.statusSuspended
  return styles.statusRemoved
}

const tierLabel: Record<string, string> = {
  free: 'Free / Basic',
  standard: 'Standard Partner',
  featured: 'Featured Partner',
  featured_plus: 'Featured+',
}

function priceDisplay(tier: string, interval: 'monthly' | 'annual'): string {
  const tiers = PRICING.tiers as Record<string, { monthlyUsd: number; annualUsd: number } | undefined>
  const t = tiers[tier]
  if (!t || t.monthlyUsd === 0) return ''
  return interval === 'monthly' ? `$${t.monthlyUsd}/month` : `$${t.annualUsd}/year`
}

export default function DashboardEditor({
  partner,
  userEmail,
  checkoutResult,
}: {
  partner: Partner
  userEmail: string
  checkoutResult?: string
}) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  // ── edit form state ──────────────────────────────────────────────────────
  const [form, setForm] = useState<EditState>({
    app_name:         partner.app_name         ?? '',
    tagline:          partner.tagline           ?? '',
    app_url:          partner.app_url           ?? '',
    description_long: partner.description_long  ?? '',
    problem_solved:   partner.problem_solved    ?? '',
    app_audience:     partner.app_audience      ?? '',
    category:         partner.category          ?? '',
    subcategory:      partner.subcategory       ?? '',
    platform:         partner.platform          ?? '',
    pricing_model:    partner.pricing_model     ?? '',
    app_status:       partner.app_status        ?? '',
  })

  const [tags,     setTags]     = useState<string[]>(partner.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [saving,   setSaving]   = useState(false)
  const [saveMsg,  setSaveMsg]  = useState<{ text: string; ok: boolean } | null>(null)

  // ── billing state ────────────────────────────────────────────────────────
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly')
  const [billingLoading,  setBillingLoading]  = useState(false)
  const [billingError,    setBillingError]    = useState<string | null>(null)

  const needsBilling = partner.pricing_tier !== 'free'
  const isSubscribed = partner.subscription_status === 'active' || partner.subscription_status === 'canceling'

  function set(field: keyof EditState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/,+$/, '')
    if (!tag || tags.includes(tag) || tags.length >= 15) return
    setTags(t => [...t, tag])
    setTagInput('')
  }

  function onTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput) {
      setTags(t => t.slice(0, -1))
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)

    const { error } = await supabase
      .from('partners')
      .update({
        app_name:         form.app_name.trim(),
        tagline:          form.tagline.trim() || null,
        app_url:          form.app_url.trim(),
        description_long: form.description_long.trim() || null,
        problem_solved:   form.problem_solved.trim() || null,
        app_audience:     form.app_audience.trim() || null,
        category:         form.category,
        subcategory:      form.subcategory.trim() || null,
        platform:         form.platform || null,
        pricing_model:    form.pricing_model || null,
        app_status:       form.app_status || null,
        tags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', partner.id)

    setSaving(false)
    if (error) {
      setSaveMsg({ text: 'Save failed — ' + error.message, ok: false })
    } else {
      setSaveMsg({ text: 'Changes saved.', ok: true })
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/dashboard/login')
  }

  async function handleCheckout() {
    setBillingLoading(true)
    setBillingError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval: billingInterval }),
      })
      const data = await res.json()
      if (!res.ok) {
        setBillingError(data.error ?? 'Could not start checkout.')
        setBillingLoading(false)
      } else {
        window.location.href = data.url
      }
    } catch {
      setBillingError('Network error. Please try again.')
      setBillingLoading(false)
    }
  }

  async function handlePortal() {
    setBillingLoading(true)
    setBillingError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setBillingError(data.error ?? 'Could not open billing portal.')
        setBillingLoading(false)
      } else {
        window.location.href = data.url
      }
    } catch {
      setBillingError('Network error. Please try again.')
      setBillingLoading(false)
    }
  }

  return (
    <div className={s.page}>
      <div className={s.inner}>

        {/* HEADER */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <h1 className={s.title}>Black<span>Found</span> Dashboard</h1>
            <span className={s.subtitle}>{userEmail}</span>
          </div>
          <button className={s.signOut} onClick={handleSignOut}>Sign out</button>
        </div>

        {/* STATUS CARD */}
        <div className={s.statusCard}>
          <div className={s.statusItem}>
            <span className={s.statusLabel}>Listing status</span>
            <span className={`${s.statusValue} ${statusClass(partner.listing_status, s)}`}>
              {partner.listing_status.charAt(0).toUpperCase() + partner.listing_status.slice(1)}
            </span>
          </div>
          <div className={s.statusItem}>
            <span className={s.statusLabel}>Current tier</span>
            <span className={s.statusValue}>{tierLabel[partner.pricing_tier] ?? partner.pricing_tier}</span>
          </div>
          {partner.subscription_status && (
            <div className={s.statusItem}>
              <span className={s.statusLabel}>Subscription</span>
              <span className={s.statusValue} style={{ textTransform: 'capitalize' }}>
                {partner.subscription_status}
              </span>
            </div>
          )}
        </div>

        {/* BILLING */}
        {needsBilling && (
          <div className={s.billingSection}>
            <div className={s.sectionTitle}>Billing</div>

            {checkoutResult === 'success' && (
              <div className={s.billingSuccess}>
                Payment received. Your listing will go live shortly once the subscription is confirmed.
              </div>
            )}
            {checkoutResult === 'canceled' && (
              <div className={s.billingNote}>
                Checkout was canceled. Your listing remains in draft until a subscription is active.
              </div>
            )}

            {isSubscribed ? (
              <>
                {partner.subscription_status === 'canceling' && (
                  <p className={s.billingNote}>
                    Your subscription is active through the end of the current billing period.
                    Your listing will remain live until then.
                  </p>
                )}
                <button
                  className={s.billingBtn}
                  onClick={handlePortal}
                  disabled={billingLoading}
                >
                  {billingLoading ? 'Opening...' : 'Manage billing'}
                </button>
              </>
            ) : (
              <>
                {partner.subscription_status === 'past_due' && (
                  <p className={s.billingWarn}>
                    Payment failed. Subscribe below to restore your listing.
                  </p>
                )}
                {partner.subscription_status === 'unpaid' && (
                  <p className={s.billingWarn}>
                    Your listing is suspended due to a payment issue. Subscribe below to reactivate.
                  </p>
                )}
                {!partner.subscription_status && (
                  <p className={s.billingNote}>
                    Your listing is in draft. Start a subscription to go live on the platform.
                  </p>
                )}

                <div className={s.intervalToggle}>
                  <button
                    type="button"
                    className={`${s.intervalBtn} ${billingInterval === 'monthly' ? s.intervalBtnActive : ''}`}
                    onClick={() => setBillingInterval('monthly')}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    className={`${s.intervalBtn} ${billingInterval === 'annual' ? s.intervalBtnActive : ''}`}
                    onClick={() => setBillingInterval('annual')}
                  >
                    Annual — 20% off
                  </button>
                </div>

                <div className={s.billingPrice}>
                  {priceDisplay(partner.pricing_tier, billingInterval)}
                </div>

                <button
                  className={s.billingBtn}
                  onClick={handleCheckout}
                  disabled={billingLoading}
                >
                  {billingLoading ? 'Opening checkout...' : 'Start subscription'}
                </button>
              </>
            )}

            {billingError && <p className={s.billingError}>{billingError}</p>}
          </div>
        )}

        {/* EDIT FORM */}
        <form className={s.form} onSubmit={handleSave} noValidate>

          {/* APP INFO */}
          <div className={s.section}>
            <div className={s.sectionTitle}>Your App</div>
            <div className={s.fields}>

              <div className={s.row}>
                <div className={s.field}>
                  <label className={s.label}>App name</label>
                  <input className={s.input} type="text" value={form.app_name}
                    onChange={e => set('app_name', e.target.value)} required />
                </div>
                <div className={s.field}>
                  <label className={s.label}>Tagline</label>
                  <input className={s.input} type="text" placeholder="Short one-liner"
                    value={form.tagline} onChange={e => set('tagline', e.target.value)} />
                </div>
              </div>

              <div className={s.field}>
                <label className={s.label}>App URL</label>
                <input className={s.input} type="url" value={form.app_url}
                  onChange={e => set('app_url', e.target.value)} required />
              </div>

              <div className={s.row}>
                <div className={s.field}>
                  <label className={s.label}>Category</label>
                  <select className={s.select} value={form.category}
                    onChange={e => set('category', e.target.value)} required>
                    <option value="">Select</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className={s.field}>
                  <label className={s.label}>Subcategory</label>
                  <input className={s.input} type="text" placeholder="Optional"
                    value={form.subcategory} onChange={e => set('subcategory', e.target.value)} />
                </div>
              </div>

              <div className={s.row}>
                <div className={s.field}>
                  <label className={s.label}>Platform</label>
                  <select className={s.select} value={form.platform}
                    onChange={e => set('platform', e.target.value)}>
                    <option value="">Select (optional)</option>
                    <option value="web">Web</option>
                    <option value="ios">iOS</option>
                    <option value="android">Android</option>
                    <option value="cross-platform">Cross-platform</option>
                  </select>
                </div>
                <div className={s.field}>
                  <label className={s.label}>App status</label>
                  <select className={s.select} value={form.app_status}
                    onChange={e => set('app_status', e.target.value)}>
                    <option value="">Select (optional)</option>
                    <option value="live">Live</option>
                    <option value="beta">Beta</option>
                  </select>
                </div>
              </div>

              <div className={s.field}>
                <label className={s.label}>App pricing model</label>
                <select className={s.select} value={form.pricing_model}
                  onChange={e => set('pricing_model', e.target.value)}>
                  <option value="">Select (optional)</option>
                  <option value="free">Free</option>
                  <option value="freemium">Freemium</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

            </div>
          </div>

          {/* DESCRIPTIONS */}
          <div className={s.section}>
            <div className={s.sectionTitle}>Listing Content</div>
            <div className={s.fields}>

              <div className={s.field}>
                <label className={s.label}>Full description</label>
                <span className={s.hint}>What your app does in detail. Shown on your listing page.</span>
                <textarea className={s.textarea} value={form.description_long}
                  onChange={e => set('description_long', e.target.value)} />
              </div>

              <div className={s.field}>
                <label className={s.label}>Problem solved</label>
                <span className={s.hint}>In one or two sentences, the specific problem your app solves.</span>
                <textarea className={s.textarea} style={{ minHeight: 72 }} value={form.problem_solved}
                  onChange={e => set('problem_solved', e.target.value)} />
              </div>

              <div className={s.field}>
                <label className={s.label}>Who it is for</label>
                <span className={s.hint}>Describe your app's target audience specifically.</span>
                <textarea className={s.textarea} style={{ minHeight: 72 }} value={form.app_audience}
                  onChange={e => set('app_audience', e.target.value)} />
              </div>

              <div className={s.field}>
                <label className={s.label}>Tags</label>
                <span className={s.hint}>Keywords that power search. Press Enter or comma to add.</span>
                <div className={s.tagWrap}>
                  {tags.length > 0 && (
                    <div className={s.tagChips}>
                      {tags.map(tag => (
                        <span key={tag} className={s.chip}>
                          {tag}
                          <button type="button" className={s.chipRemove}
                            onClick={() => setTags(t => t.filter(x => x !== tag))}
                            aria-label={`Remove tag ${tag}`}>x</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input className={s.input} type="text" placeholder="Type a tag and press Enter"
                    value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={onTagKeyDown}
                    onBlur={() => { if (tagInput) addTag(tagInput) }} />
                </div>
              </div>

            </div>
          </div>

          {/* SAVE */}
          <div className={s.saveRow}>
            <button className={s.saveBtn} type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            {saveMsg && (
              <span className={`${s.saveMsg} ${saveMsg.ok ? s.saveMsgOk : s.saveMsgErr}`}>
                {saveMsg.text}
              </span>
            )}
          </div>

        </form>
      </div>
    </div>
  )
}
