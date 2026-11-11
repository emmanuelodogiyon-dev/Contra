import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSupabase } from '../../../../lib/server/supabase-admin'
import { initializeKoraCharge } from '../../../../lib/server/korapay'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const authorization = request.headers.get('authorization') || ''
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
    if (!token) return NextResponse.json({ error: 'Sign in before entering a tournament.' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifvteqtimhisrweaihid.supabase.co'
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!anonKey) return NextResponse.json({ error: 'Supabase publishable key is not configured.' }, { status: 503 })
    const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: { user }, error: authError } = await authClient.auth.getUser(token)
    if (authError || !user?.email) return NextResponse.json({ error: 'Your session is invalid. Sign in again.' }, { status: 401 })

    const body = await request.json()
    const tournamentId = String(body.tournamentId || '')
    if (!/^[0-9a-f-]{36}$/i.test(tournamentId)) return NextResponse.json({ error: 'Choose a valid tournament.' }, { status: 400 })

    const admin = getAdminSupabase()
    const { data: event, error: eventError } = await admin
      .from('tournament_events')
      .select('id,name,entry_fee_minor,currency,status,cash_enabled,starts_at,ends_at,max_players')
      .eq('id', tournamentId)
      .maybeSingle()
    if (eventError) throw eventError
    if (!event || event.status !== 'open' || event.cash_enabled !== true) {
      return NextResponse.json({ error: 'This cash tournament is not open for registration.' }, { status: 409 })
    }
    if (event.currency !== 'NGN' || !Number.isSafeInteger(event.entry_fee_minor) || event.entry_fee_minor < 100) {
      return NextResponse.json({ error: 'Tournament payment configuration is invalid.' }, { status: 409 })
    }
    const now = Date.now()
    if (event.starts_at && new Date(event.starts_at).getTime() <= now) {
      return NextResponse.json({ error: 'Registration for this tournament has closed.' }, { status: 409 })
    }
    if (event.ends_at && new Date(event.ends_at).getTime() <= now) {
      return NextResponse.json({ error: 'This tournament has ended.' }, { status: 409 })
    }

    const reference = `SS-${crypto.randomUUID().replaceAll('-', '').toUpperCase()}`
    const { error: entryError } = await admin.from('tournament_entries').insert({
      tournament_id: event.id,
      user_id: user.id,
      payment_reference: reference,
      amount_minor: event.entry_fee_minor,
      currency: event.currency,
      payment_status: 'pending',
      entry_status: 'awaiting_payment',
    })
    if (entryError) {
      if (entryError.code === '23505') return NextResponse.json({ error: 'You already have an entry or payment in progress for this tournament.' }, { status: 409 })
      throw entryError
    }

    let checkout
    try {
      const origin = new URL(request.url).origin
      checkout = await initializeKoraCharge({
        amount: event.entry_fee_minor,
        currency: event.currency,
        reference,
        redirect_url: `${origin}/tournaments/payment-result`,
        notification_url: `${origin}/api/payments/korapay/webhook`,
        narration: `Shadow Strike entry: ${event.name}`,
        customer: {
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
        },
        merchant_bears_cost: true,
      })
    } catch (error) {
      await admin.from('tournament_entries').update({ payment_status: 'initialization_failed' }).eq('payment_reference', reference)
      throw error
    }

    return NextResponse.json({ checkoutUrl: checkout.checkout_url, reference })
  } catch (error) {
    console.error('Tournament checkout error:', error.message)
    return NextResponse.json({ error: error.message || 'Unable to start payment.' }, { status: 503 })
  }
}
