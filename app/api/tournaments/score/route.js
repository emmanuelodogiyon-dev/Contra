import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Cash-prize score acceptance is intentionally blocked until the game submits
// a server-verifiable replay/proof rather than a client-reported score.
export async function POST() {
  if (process.env.SHADOW_STRIKE_CASH_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Cash tournament score submissions are disabled.' }, { status: 409 })
  }
  return NextResponse.json({
    error: 'Cash-prize scoring is not available until server-authoritative replay verification is implemented and audited.'
  }, { status: 503 })
}
