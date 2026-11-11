import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/server/require-admin'

export const runtime = 'nodejs'

export async function GET(request) {
  const auth = await requireAdmin(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { admin } = auth
  const [events, entries, results, payouts, ledger] = await Promise.all([
    admin.from('tournament_events').select('*').order('created_at', { ascending: false }).limit(100),
    admin.from('tournament_entries').select('id,tournament_id,user_id,payment_reference,amount_minor,currency,payment_status,entry_status,paid_at,created_at').order('created_at', { ascending: false }).limit(200),
    admin.from('tournament_results').select('*').order('created_at', { ascending: false }).limit(200),
    admin.from('tournament_payout_requests').select('id,tournament_id,user_id,result_id,amount_minor,currency,bank_code,bank_name,account_name,status,kora_reference,failure_reason,created_at').order('created_at', { ascending: false }).limit(200),
    admin.from('tournament_ledger').select('id,tournament_id,user_id,kind,amount_minor,currency,reference,description,created_at').order('created_at', { ascending: false }).limit(200),
  ])
  for (const r of [events,entries,results,payouts,ledger]) if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 })
  return NextResponse.json({ events: events.data, entries: entries.data, results: results.data, payouts: payouts.data, ledger: ledger.data })
}

export async function POST(request) {
  const auth = await requireAdmin(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { admin, user } = auth
  try {
    const body = await request.json()
    if (body.action === 'create_event') {
      const name = String(body.name || '').trim()
      const fee = Number(body.entryFeeNaira)
      const maxPlayers = Number(body.maxPlayers || 32)
      if (name.length < 3 || name.length > 80 || !Number.isFinite(fee) || fee < 1 || fee > 1000000 || !Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 10000) return NextResponse.json({ error: 'Check event name, entry fee and player limit.' }, { status: 400 })
      const { data, error } = await admin.from('tournament_events').insert({ name, description: String(body.description || '').slice(0,500), entry_fee_minor: Math.round(fee * 100), currency: 'NGN', status: 'draft', cash_enabled: false, max_players: maxPlayers, starts_at: body.startsAt || null, ends_at: body.endsAt || null, rules: String(body.rules || '').slice(0,5000), created_by: user.id }).select().single()
      if (error) throw error
      return NextResponse.json({ event: data })
    }
    if (body.action === 'set_event_status') {
      const allowed = ['draft','open','locked','completed','cancelled']
      if (!allowed.includes(body.status) || !body.eventId) return NextResponse.json({ error: 'Invalid event update.' }, { status: 400 })
      const update = { status: body.status, updated_at: new Date().toISOString() }
      if (typeof body.cashEnabled === 'boolean') update.cash_enabled = body.cashEnabled && process.env.SHADOW_STRIKE_CASH_ENABLED === 'true'
      const { data, error } = await admin.from('tournament_events').update(update).eq('id', body.eventId).select().single()
      if (error) throw error
      return NextResponse.json({ event: data })
    }
    if (body.action === 'review_result') {
      if (!['approved','rejected','flagged'].includes(body.status) || !body.resultId) return NextResponse.json({ error: 'Invalid result review.' }, { status: 400 })
      const { data, error } = await admin.from('tournament_results').update({ verification_status: body.status, review_note: String(body.note || '').slice(0,1000), reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', body.resultId).select().single()
      if (error) throw error
      return NextResponse.json({ result: data })
    }
    if (body.action === 'set_prize') {
      const amount = Number(body.amountNaira)
      if (!body.eventId || !Number.isFinite(amount) || amount < 0 || amount > 100000000) return NextResponse.json({ error: 'Invalid prize pool.' }, { status: 400 })
      const { data, error } = await admin.from('tournament_events').update({ prize_pool_minor: Math.round(amount * 100), updated_at: new Date().toISOString() }).eq('id', body.eventId).select().single()
      if (error) throw error
      return NextResponse.json({ event: data })
    }
    if (body.action === 'approve_payout') {
      if (!body.payoutId) return NextResponse.json({ error: 'Payout request is required.' }, { status: 400 })
      const { data: payout, error: pe } = await admin.from('tournament_payout_requests').select('id,status,result_id').eq('id', body.payoutId).single()
      if (pe) throw pe
      if (payout.status !== 'pending_review') return NextResponse.json({ error: 'Payout is not awaiting review.' }, { status: 409 })
      const { data: result, error: re } = await admin.from('tournament_results').select('verification_status,payout_amount_minor').eq('id', payout.result_id).single()
      if (re) throw re
      if (result.verification_status !== 'approved' || !result.payout_amount_minor) return NextResponse.json({ error: 'Prize result is not approved.' }, { status: 409 })
      const { data, error } = await admin.from('tournament_payout_requests').update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', payout.id).eq('status', 'pending_review').select('id,status').single()
      if (error) throw error
      return NextResponse.json({ payout: data })
    }
    return NextResponse.json({ error: 'Unknown admin action.' }, { status: 400 })
  } catch (error) {
    console.error('Tournament admin error:', error.message)
    return NextResponse.json({ error: 'Admin action could not be completed.' }, { status: 500 })
  }
}
