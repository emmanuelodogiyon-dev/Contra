import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getAdminSupabase } from '../../../../../lib/server/supabase-admin'
import { getKoraSecret } from '../../../../../lib/server/korapay'

export const runtime = 'nodejs'

function validSignature(data, signature, secret) {
  if (!signature || typeof signature !== 'string') return false
  const expected = createHmac('sha256', secret).update(JSON.stringify(data)).digest('hex')
  const suppliedBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer)
}

export async function POST(request) {
  try {
    const payload = await request.json()
    const data = payload?.data
    const signature = request.headers.get('x-korapay-signature')
    if (!data || !validSignature(data, signature, getKoraSecret())) {
      return NextResponse.json({ received: false, error: 'Invalid signature' }, { status: 401 })
    }

    const reference = String(data.reference || '')
    if (!reference || !['charge.success', 'charge.failed'].includes(payload.event)) {
      return NextResponse.json({ received: true })
    }

    const admin = getAdminSupabase()
    const { data: entry, error: lookupError } = await admin
      .from('tournament_entries')
      .select('id,amount_minor,currency,payment_status')
      .eq('payment_reference', reference)
      .maybeSingle()
    if (lookupError) throw lookupError
    if (!entry) return NextResponse.json({ received: true })

    const paidAmount = Number(data.amount)
    const isSuccessful = payload.event === 'charge.success'
      && data.status === 'success'
      && data.currency === entry.currency
      && Number.isFinite(paidAmount)
      && Math.round(paidAmount * 100) === entry.amount_minor

    if (entry.payment_status === 'paid') return NextResponse.json({ received: true, duplicate: true })

    const { error: updateError } = await admin
      .from('tournament_entries')
      .update({
        payment_status: isSuccessful ? 'paid' : 'failed',
        entry_status: isSuccessful ? 'registered' : 'payment_failed',
        paid_at: isSuccessful ? new Date().toISOString() : null,
        provider_payload: payload,
      })
      .eq('id', entry.id)
      .neq('payment_status', 'paid')
    if (updateError) throw updateError
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Kora webhook processing error:', error.message)
    return NextResponse.json({ received: false }, { status: 500 })
  }
}
