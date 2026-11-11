import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSupabase } from '../../../../lib/server/supabase-admin'

export const runtime = 'nodejs'

export async function GET(request) {
  try {
    const token = (request.headers.get('authorization') || '').replace(/^Bearer /, '')
    if (!token) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifvteqtimhisrweaihid.supabase.co'
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_5aPcEtQvyw8xReetWalPSA_OHtyQXn8'
    if (!key) return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 503 })
    const auth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: { user }, error: authError } = await auth.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })
    const reference = new URL(request.url).searchParams.get('reference') || ''
    const admin = getAdminSupabase()
    const { data, error } = await admin.from('tournament_entries')
      .select('tournament_id,payment_status,entry_status,amount_minor,currency')
      .eq('payment_reference', reference).eq('user_id', user.id).maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Payment record not found.' }, { status: 404 })
    return NextResponse.json({ payment: data })
  } catch (error) {
    console.error('Payment status error:', error.message)
    return NextResponse.json({ error: 'Unable to check payment status.' }, { status: 503 })
  }
}
