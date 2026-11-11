import { NextResponse } from 'next/server'
import { getAdminSupabase } from '../../../../lib/server/supabase-admin'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const admin = getAdminSupabase()
    const { data, error } = await admin
      .from('tournament_events')
      .select('id,name,description,entry_fee_minor,currency,starts_at,ends_at,max_players')
      .eq('status', 'open')
      .eq('cash_enabled', true)
      .order('starts_at', { ascending: true })
    if (error) throw error
    return NextResponse.json({ events: data || [] })
  } catch (error) {
    console.error('Tournament list error:', error.message)
    return NextResponse.json({ error: 'Tournament listings are temporarily unavailable.' }, { status: 503 })
  }
}
