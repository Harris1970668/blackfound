'use client'

import { useState } from 'react'
import s from './admin.module.css'

type Application = {
  id: string
  app_name: string
  tagline: string | null
  description_long: string | null
  problem_solved: string | null
  app_audience: string | null
  why_built: string | null
  app_url: string
  category: string
  subcategory: string | null
  tags: string[] | null
  platform: string | null
  pricing_model: string | null
  app_status: string | null
  requested_tier: string
  builder_name: string
  contact_email: string
  created_at: string
}

type ActionState = { status: 'idle' | 'loading' | 'done' | 'error'; message?: string }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function AppCard({ app }: { app: Application }) {
  const [action, setAction] = useState<ActionState>({ status: 'idle' })
  const busy = action.status === 'loading'
  const done = action.status === 'done'

  async function post(endpoint: string) {
    setAction({ status: 'loading' })
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: app.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAction({ status: 'error', message: data.error ?? 'Action failed.' })
      } else {
        const verb = endpoint.includes('approve') ? 'Approved' : 'Declined'
        setAction({ status: 'done', message: `${verb} — email sent.` })
      }
    } catch {
      setAction({ status: 'error', message: 'Network error.' })
    }
  }

  return (
    <div className={`${s.card} ${done ? s.cardActioned : ''}`}>

      {/* Header */}
      <div className={s.cardHeader}>
        <div className={s.appMeta}>
          <div className={s.appName}>{app.app_name}</div>
          {app.tagline && <div className={s.tagline}>{app.tagline}</div>}
          <div className={s.metaRow}>
            <span className={`${s.badge} ${s.tierBadge}`}>{app.requested_tier}</span>
            <span className={s.badge}>{app.category}</span>
            {app.subcategory && <span className={s.badge}>{app.subcategory}</span>}
            {app.platform && <span className={s.badge}>{app.platform}</span>}
            {app.app_status && <span className={s.badge}>{app.app_status}</span>}
            {app.pricing_model && <span className={s.badge}>{app.pricing_model}</span>}
          </div>
          <a href={app.app_url} target="_blank" rel="noopener noreferrer" className={s.appUrl}>
            {app.app_url}
          </a>
        </div>
        <div className={s.submitted}>Submitted {formatDate(app.created_at)}</div>
      </div>

      {/* Body */}
      <div className={s.cardBody}>

        {app.description_long && (
          <div className={s.field}>
            <span className={s.fieldLabel}>Full description</span>
            <p className={s.fieldValue}>{app.description_long}</p>
          </div>
        )}

        {app.problem_solved && (
          <div className={s.field}>
            <span className={s.fieldLabel}>Problem solved</span>
            <p className={s.fieldValue}>{app.problem_solved}</p>
          </div>
        )}

        {app.app_audience && (
          <div className={s.field}>
            <span className={s.fieldLabel}>Who it is for</span>
            <p className={s.fieldValue}>{app.app_audience}</p>
          </div>
        )}

        {app.tags && app.tags.length > 0 && (
          <div className={s.field}>
            <span className={s.fieldLabel}>Tags</span>
            <div className={s.tags}>
              {app.tags.map(tag => (
                <span key={tag} className={s.tag}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {app.why_built && (
          <div className={s.field}>
            <span className={s.fieldLabel}>Why built</span>
            <p className={s.fieldValue}>{app.why_built}</p>
          </div>
        )}

        <div className={s.builderRow}>
          <div className={s.field}>
            <span className={s.fieldLabel}>Builder</span>
            <span className={s.fieldValue}>{app.builder_name}</span>
          </div>
          <div className={s.field}>
            <span className={s.fieldLabel}>Contact email</span>
            <span className={s.fieldValue}>{app.contact_email}</span>
          </div>
        </div>

      </div>

      {/* Actions */}
      <div className={s.actions}>
        <button
          className={s.btnApprove}
          disabled={busy || done}
          onClick={() => post('/api/admin/approve')}
        >
          {busy ? 'Working...' : 'Approve'}
        </button>
        <button
          className={s.btnDecline}
          disabled={busy || done}
          onClick={() => post('/api/admin/decline')}
        >
          Decline
        </button>
        {action.message && (
          <span className={`${s.actionMsg} ${action.status === 'error' ? s.actionMsgErr : s.actionMsgOk}`}>
            {action.message}
          </span>
        )}
      </div>

    </div>
  )
}

export default function AdminQueue({ applications }: { applications: Application[] }) {
  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.header}>
          <h1 className={s.title}>
            Black<span>Found</span> — Admin
          </h1>
          <span className={s.count}>
            {applications.length} pending application{applications.length !== 1 ? 's' : ''}
          </span>
        </div>

        {applications.length === 0 ? (
          <div className={s.empty}>No pending applications.</div>
        ) : (
          applications.map(app => <AppCard key={app.id} app={app} />)
        )}
      </div>
    </div>
  )
}
