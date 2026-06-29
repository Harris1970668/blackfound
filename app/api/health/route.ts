import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServerClient()
    const tables = ['partner_applications', 'partners', 'dashboard_invites', 'partner_click_events']
    const results: Record<string, string> = {}

    for (const table of tables) {
      const { error } = await supabase.from(table).select('*', { count: 'exact', head: true })
      results[table] = error ? `FAIL: ${error.message}` : 'OK'
    }

    const allOk = Object.values(results).every(v => v === 'OK')
    return Response.json({ connected: allOk, tables: results }, { status: allOk ? 200 : 500 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ connected: false, error: message }, { status: 500 })
  }
}
