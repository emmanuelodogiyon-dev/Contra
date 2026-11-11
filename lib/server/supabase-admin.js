import { createClient } from '@supabase/supabase-js'

export function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifvteqtimhisrweaihid.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
