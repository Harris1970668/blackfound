'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function InviteClaim({ token }: { token: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<'claiming' | 'success' | 'error'>('claiming')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function claim() {
      try {
        const res = await fetch('/api/dashboard/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()
        if (!res.ok) {
          setStatus('error')
          setMessage(data.error ?? 'Failed to claim invite.')
        } else {
          setStatus('success')
          router.replace('/dashboard')
        }
      } catch {
        setStatus('error')
        setMessage('Network error. Please try again.')
      }
    }
    claim()
  }, [token, router])

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
    maxWidth: 420,
    width: '100%',
    textAlign: 'center',
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 14 }}>
          Black<span style={{ color: 'var(--primary)' }}>Found</span>
        </p>
        {status === 'claiming' && (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Validating your invite link...</p>
        )}
        {status === 'success' && (
          <p style={{ color: 'var(--live)', fontSize: 14 }}>Invite accepted. Redirecting to your dashboard...</p>
        )}
        {status === 'error' && (
          <>
            <p style={{ color: '#ff6b6b', fontSize: 14, marginBottom: 16 }}>{message}</p>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>
              If you believe this is an error, contact{' '}
              <a href="mailto:pulsenetworkadmin@gmail.com" style={{ color: 'var(--primary)' }}>
                pulsenetworkadmin@gmail.com
              </a>.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
