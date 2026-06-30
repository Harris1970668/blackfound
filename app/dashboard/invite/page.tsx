import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase-auth-server'
import InviteClaim from './InviteClaim'

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)', fontSize: 15 }}>
        Invalid invite link — no token provided.
      </div>
    )
  }

  const user = await getCurrentUser()

  if (!user) {
    const next = `/dashboard/invite?token=${encodeURIComponent(token)}`
    redirect(`/dashboard/login?next=${encodeURIComponent(next)}`)
  }

  return <InviteClaim token={token} />
}
