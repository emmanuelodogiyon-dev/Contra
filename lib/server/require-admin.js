import { createClient } from '@supabase/supabase-js'
import { getAdminSupabase } from './supabase-admin'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifvteqtimhisrweaihid.supabase.co'
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_5aPcEtQvyw8xReetWalPSA_OHtyQXn8'

export async function requireAdmin(request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer /, '')
  if (!token) return { error: 'Sign in required.', status: 401 }
  const auth = createClient(URL, PUBLIC_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: { user }, error } = await auth.auth.getUser(token)
  if (error || !user?.email) return { error: 'Invalid session.', status: 401 }
  const allowed = (process.env.SHADOW_STRIKE_ADMIN_EMAILS || 'emmanuelodogiyon@gmail.com').split(',').map(x => x.trim().toLowerCase()).filter(Boolean)
  if (!allowed.includes(user.email.toLowerCase())) return { error: 'Admin access is not enabled for this account.', status: 403 }
  return { user, admin: getAdminSupabase() }
}
