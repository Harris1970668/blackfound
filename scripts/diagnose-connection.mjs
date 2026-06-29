import { createClient } from '@supabase/supabase-js'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { version } = require('@supabase/supabase-js/package.json')
console.log('@supabase/supabase-js version:', version)

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL set:', !!url)
console.log('Service role key set:', !!key)

const supabase = createClient(url, key, { auth: { persistSession: false } })

const { data, error, status, statusText } = await supabase
  .from('partners')
  .select('*', { count: 'exact', head: true })

console.log('HTTP status:', status, statusText)
console.log('error object:', JSON.stringify(error, null, 2))
console.log('data:', data)
