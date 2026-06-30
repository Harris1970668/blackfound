import { redirect } from 'next/navigation'
import { getAdminUser, isAdmin } from '@/lib/supabase-auth-server'
import { createServerClient } from '@/lib/supabase-server'
import AdminQueue from './AdminQueue'

export default async function AdminPage() {
  const user = await getAdminUser()

  if (!user) redirect('/admin/login')

  if (!isAdmin(user.email)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)', fontSize: 15 }}>
        403 — Not authorized.
      </div>
    )
  }

  const supabase = createServerClient()
  const { data: applications, error } = await supabase
    .from('partner_applications')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Admin queue fetch error:', error)
  }

  return <AdminQueue applications={applications ?? []} />
}
