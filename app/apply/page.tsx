'use client'

import { useState, KeyboardEvent } from 'react'
import s from './page.module.css'
import PRICING from '@/lib/config'

const CATEGORIES = [
  'Analytics & Data',
  'Business & Operations',
  'Communication',
  'Creative Tools',
  'Developer Tools',
  'E-commerce & Retail',
  'Education & Learning',
  'Finance & Money',
  'Health & Fitness',
  'Marketing & Growth',
  'Productivity',
  'Other',
]

type FormData = {
  app_name: string
  tagline: string
  app_url: string
  category: string
  subcategory: string
  platform: string
  app_status: string
  description_long: string
  problem_solved: string
  app_audience: string
  pricing_model: string
  requested_tier: string
  builder_name: string
  contact_email: string
  why_built: string
}

const EMPTY: FormData = {
  app_name: '',
  tagline: '',
  app_url: '',
  category: '',
  subcategory: '',
  platform: '',
  app_status: '',
  description_long: '',
  problem_solved: '',
  app_audience: '',
  pricing_model: '',
  requested_tier: '',
  builder_name: '',
  contact_email: '',
  why_built: '',
}

const TIERS = [
  {
    id: 'free',
    name: 'Free / Basic',
    price: '$0',
    annual: '',
    features: 'Standard grid listing, limited fields, no badge',
  },
  {
    id: 'standard',
    name: 'Standard Partner',
    price: `$${PRICING.tiers.standard.monthlyUsd}/mo`,
    annual: `or $${PRICING.tiers.standard.annualUsd}/yr (20% off)`,
    features: 'Full listing, all fields, Partner badge, link-through',
  },
  {
    id: 'featured',
    name: 'Featured Partner',
    price: `$${PRICING.tiers.featured.monthlyUsd}/mo`,
    annual: `or $${PRICING.tiers.featured.annualUsd}/yr (20% off)`,
    features: 'Top-of-category placement, Featured badge, homepage rotation, click analytics',
  },
]

export default function ApplyPage() {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: keyof FormData, value: string) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (tags.length < 3) {
      setError('Please add at least 3 tags before submitting.')
      return
    }
    if (!form.requested_tier) {
      setError('Please select a listing tier.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tags }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className={s.page}>
        <div className={s.inner}>
          <div className={s.success}>
            <h1 className={s.successTitle}>
              Application <span>received.</span>
            </h1>
            <p className={s.successText}>
              Thank you for applying to BlackFound. Your application is pending review.
              You will hear from us at the email address you provided — usually within a few business days.
              Nothing goes live until your listing is manually approved.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <header className={s.header}>
          <div className={s.eyebrow}>Partner Applications</div>
          <h1 className={s.title}>
            List your app on <span>BlackFound</span>
          </h1>
          <p className={s.subtitle}>
            BlackFound is open to all independent SaaS builders regardless of background.
            Applications are reviewed manually — nothing goes live until approved.
            Fill out the form below and we will be in touch.
          </p>
        </header>

        <form className={s.form} onSubmit={handleSubmit} noValidate>

          {/* YOUR APP */}
          <div className={s.section}>
            <div className={s.sectionTitle}>Your App</div>
            <div className={s.fields}>

              <div className={s.row}>
                <div className={s.field}>
                  <label className={s.label}>
                    App name <span className={s.required}>*</span>
                  </label>
                  <input
                    className={s.input}
                    type="text"
                    placeholder="e.g. PulseDebtFree"
                    value={form.app_name}
                    onChange={e => set('app_name', e.target.value)}
                    required
                  />
                </div>
                <div className={s.field}>
                  <label className={s.label}>
                    Tagline <span className={s.required}>*</span>
                  </label>
                  <input
                    className={s.input}
                    type="text"
                    placeholder="One short line that says what you do"
                    value={form.tagline}
                    onChange={e => set('tagline', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={s.field}>
                <label className={s.label}>
                  App URL <span className={s.required}>*</span>
                </label>
                <input
                  className={s.input}
                  type="url"
                  placeholder="https://yourapp.com"
                  value={form.app_url}
                  onChange={e => set('app_url', e.target.value)}
                  required
                />
              </div>

              <div className={s.row}>
                <div className={s.field}>
                  <label className={s.label}>
                    Category <span className={s.required}>*</span>
                  </label>
                  <select
                    className={s.select}
                    value={form.category}
                    onChange={e => set('category', e.target.value)}
                    required
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className={s.field}>
                  <label className={s.label}>Subcategory</label>
                  <input
                    className={s.input}
                    type="text"
                    placeholder="Optional finer grouping"
                    value={form.subcategory}
                    onChange={e => set('subcategory', e.target.value)}
                  />
                </div>
              </div>

              <div className={s.row}>
                <div className={s.field}>
                  <label className={s.label}>Platform</label>
                  <select
                    className={s.select}
                    value={form.platform}
                    onChange={e => set('platform', e.target.value)}
                  >
                    <option value="">Select (optional)</option>
                    <option value="web">Web</option>
                    <option value="ios">iOS</option>
                    <option value="android">Android</option>
                    <option value="cross-platform">Cross-platform</option>
                  </select>
                </div>
                <div className={s.field}>
                  <label className={s.label}>App status</label>
                  <select
                    className={s.select}
                    value={form.app_status}
                    onChange={e => set('app_status', e.target.value)}
                  >
                    <option value="">Select (optional)</option>
                    <option value="live">Live</option>
                    <option value="beta">Beta</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* TELL US MORE */}
          <div className={s.section}>
            <div className={s.sectionTitle}>Tell Us More</div>
            <div className={s.fields}>

              <div className={s.field}>
                <label className={s.label}>
                  Full description <span className={s.required}>*</span>
                </label>
                <span className={s.hint}>
                  Describe what your app does in detail. What makes it different from alternatives?
                </span>
                <textarea
                  className={s.textarea}
                  placeholder="Give visitors a clear picture of everything your app does and why it stands out."
                  value={form.description_long}
                  onChange={e => set('description_long', e.target.value)}
                  required
                />
              </div>

              <div className={s.field}>
                <label className={s.label}>
                  Problem solved <span className={s.required}>*</span>
                </label>
                <span className={s.hint}>
                  In one or two sentences, what specific problem does your app solve for its users?
                </span>
                <textarea
                  className={`${s.textarea} ${s.textareaShort}`}
                  placeholder="e.g. Most debt payoff tools are built for people who already have a plan. Ours builds the plan for you."
                  value={form.problem_solved}
                  onChange={e => set('problem_solved', e.target.value)}
                  required
                />
              </div>

              <div className={s.field}>
                <label className={s.label}>
                  Who it is for <span className={s.required}>*</span>
                </label>
                <span className={s.hint}>
                  Describe your app's target audience — who gets the most value from it?
                  Be specific: "small business owners tracking inventory" is more useful than "businesses."
                </span>
                <textarea
                  className={`${s.textarea} ${s.textareaShort}`}
                  placeholder="e.g. Freelancers and contractors who invoice clients and need to track unpaid invoices without a full accounting suite."
                  value={form.app_audience}
                  onChange={e => set('app_audience', e.target.value)}
                  required
                />
              </div>

              <div className={s.field}>
                <label className={s.label}>
                  Tags <span className={s.required}>*</span>
                </label>
                <span className={s.hint}>
                  Add at least 3 keywords that describe your app — these power search.
                  Press Enter or comma to add each tag.
                </span>
                <div className={s.tagWrap}>
                  {tags.length > 0 && (
                    <div className={s.tagChips}>
                      {tags.map(tag => (
                        <span key={tag} className={s.chip}>
                          {tag}
                          <button
                            type="button"
                            className={s.chipRemove}
                            onClick={() => setTags(t => t.filter(x => x !== tag))}
                            aria-label={`Remove tag ${tag}`}
                          >
                            x
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    className={s.input}
                    type="text"
                    placeholder="Type a tag and press Enter"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={onTagKeyDown}
                    onBlur={() => { if (tagInput) addTag(tagInput) }}
                  />
                  <span className={tags.length >= 3 ? `${s.tagCount} ${s.tagCountOk}` : s.tagCount}>
                    {tags.length} tag{tags.length !== 1 ? 's' : ''} added — minimum 3 required
                  </span>
                </div>
              </div>

              <div className={s.field}>
                <label className={s.label}>App pricing model</label>
                <select
                  className={s.select}
                  value={form.pricing_model}
                  onChange={e => set('pricing_model', e.target.value)}
                >
                  <option value="">Select (optional)</option>
                  <option value="free">Free</option>
                  <option value="freemium">Freemium</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

            </div>
          </div>

          {/* LISTING TIER */}
          <div className={s.section}>
            <div className={s.sectionTitle}>Choose a Listing Tier <span className={s.required}>*</span></div>
            <div className={s.tierCards}>
              {TIERS.map(tier => (
                <button
                  key={tier.id}
                  type="button"
                  className={`${s.tierCard} ${form.requested_tier === tier.id ? s.tierCardSelected : ''}`}
                  onClick={() => set('requested_tier', tier.id)}
                >
                  <div className={s.tierName}>{tier.name}</div>
                  <div className={s.tierPrice}>{tier.price}</div>
                  {tier.annual && <div className={s.tierAnnual}>{tier.annual}</div>}
                  <div className={s.tierFeatures}>{tier.features}</div>
                </button>
              ))}
            </div>
          </div>

          {/* YOUR INFO */}
          <div className={s.section}>
            <div className={s.sectionTitle}>Your Info</div>
            <div className={s.fields}>

              <div className={s.row}>
                <div className={s.field}>
                  <label className={s.label}>
                    Builder / business name <span className={s.required}>*</span>
                  </label>
                  <input
                    className={s.input}
                    type="text"
                    placeholder="Your name or company name"
                    value={form.builder_name}
                    onChange={e => set('builder_name', e.target.value)}
                    required
                  />
                </div>
                <div className={s.field}>
                  <label className={s.label}>
                    Contact email <span className={s.required}>*</span>
                  </label>
                  <input
                    className={s.input}
                    type="email"
                    placeholder="you@example.com"
                    value={form.contact_email}
                    onChange={e => set('contact_email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={s.field}>
                <label className={s.label}>What inspired you to build this? (optional)</label>
                <span className={s.hint}>
                  Share the story behind your app if you'd like. Not required, but it helps us understand your vision.
                </span>
                <textarea
                  className={`${s.textarea} ${s.textareaShort}`}
                  placeholder="Optional: what problem were you personally facing, or what gap did you see in the market?"
                  value={form.why_built}
                  onChange={e => set('why_built', e.target.value)}
                />
              </div>

            </div>
          </div>

          {/* SUBMIT */}
          <div className={s.submitRow}>
            {error && <div className={s.formError}>{error}</div>}
            <button className={s.submit} type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit application'}
            </button>
            <p className={s.formNote}>
              Your application goes into a manual review queue. Nothing is published until approved.
              By submitting you agree to the{' '}
              <a href="/terms" style={{ color: 'var(--primary)' }}>BlackFound Partner Terms</a>.
            </p>
          </div>

        </form>
      </div>
    </div>
  )
}
