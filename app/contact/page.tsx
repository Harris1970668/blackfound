'use client'

import { useState } from 'react'
import s from './page.module.css'

export default function ContactPage() {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [message, setMessage] = useState('')
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSending(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
      } else {
        setSent(true)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <p className={s.eyebrow}>Contact</p>
        <h1 className={s.heading}>
          Black<span>Found</span>
        </h1>
        <p className={s.sub}>
          Have a question about your listing, your application, or the platform?
          Send a message to The Administration and we will respond to the email you provide.
        </p>

        {sent ? (
          <div className={s.success}>
            Your message has been sent to The Administration. We will be in touch.
          </div>
        ) : (
          <form className={s.form} onSubmit={handleSubmit} noValidate>
            <div className={s.field}>
              <label className={s.label} htmlFor="contact-name">Name</label>
              <input
                id="contact-name"
                className={s.input}
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor="contact-email">Email</label>
              <input
                id="contact-email"
                className={s.input}
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                className={s.textarea}
                placeholder="How can we help?"
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
            </div>

            {error && <p className={s.error}>{error}</p>}

            <button className={s.submit} type="submit" disabled={sending}>
              {sending ? 'Sending...' : 'Send message'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
