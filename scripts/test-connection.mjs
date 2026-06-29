import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const tables = ['partner_applications', 'partners', 'dashboard_invites', 'partner_click_events']
let allOk = true

for (const table of tables) {
  const { error } = await supabase.from(table).select('*', { count: 'exact', head: true })
  if (error) {
    console.error(`FAIL  ${table}: ${error.message}`)
    allOk = false
  } else {
    console.log(`OK    ${table}`)
  }
}

console.log(allOk ? '\nAll four tables confirmed.' : '\nOne or more tables failed.')
process.exit(allOk ? 0 : 1)
