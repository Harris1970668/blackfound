'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/dashboard/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, next }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
      } else {
        setSent(true)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const wrap: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: 'var(--bg)',
  }

  const card: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '400px',
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <p style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>
          Partner Access
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 8 }}>
          Black<span style={{ color: 'var(--primary)' }}>Found</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
          Enter the email address you used in your application. We will send you a sign-in link.
        </p>

        {sent ? (
          <div style={{ background: 'rgba(47,203,122,.08)', border: '1px solid rgba(47,203,122,.3)', borderRadius: 8, color: 'var(--live)', fontSize: 14, padding: '14px 16px', lineHeight: 1.6 }}>
            Sign-in link sent. Check your email and click the link to access your dashboard.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                padding: '10px 14px',
                width: '100%',
              }}
            />
            {error && <p style={{ color: '#ff6b6b', fontSize: 13, margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: 'var(--primary)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 700,
                opacity: submitting ? 0.5 : 1,
                padding: '11px 0',
                width: '100%',
              }}
            >
              {submitting ? 'Sending...' : 'Send sign-in link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function DashboardLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
