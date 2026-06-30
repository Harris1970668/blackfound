import { redirect } from 'next/navigation'
import { getCurrentUser, createAuthServerClient } from '@/lib/supabase-auth-server'
import DashboardEditor from './DashboardEditor'
import s from './dashboard.module.css'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/dashboard/login')

  // Query through the auth client so RLS applies — returns only this user's row
  const supabase = await createAuthServerClient()
  const { data: partner, error } = await supabase
    .from('partners')
    .select('id, app_name, tagline, app_url, description_long, problem_solved, app_audience, tags, category, subcategory, platform, pricing_model, app_status, listing_status, pricing_tier')
    .maybeSingle()

  if (error) console.error('Dashboard fetch error:', error)

  if (!partner) {
    return (
      <div className={s.page}>
        <div className={s.inner}>
          <div className={s.noListing}>
            No listing found for this account.
            <br />
            If you received an invite link, use it to claim your dashboard.
            <br />
            Questions? Email{' '}
            <a href="mailto:pulsenetworkadmin@gmail.com" style={{ color: 'var(--primary)' }}>
              pulsenetworkadmin@gmail.com
            </a>
          </div>
        </div>
      </div>
    )
  }

  return <DashboardEditor partner={partner} userEmail={user.email ?? ''} />
}
