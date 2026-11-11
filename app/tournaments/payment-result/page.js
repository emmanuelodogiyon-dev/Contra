'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabase } from '../../../lib/supabase'

export default function TournamentPaymentResult() {
  const [message, setMessage] = useState('Checking your payment confirmation…')
  const [state, setState] = useState('pending')

  useEffect(() => {
    let cancelled = false
    let interval
    const params = new URLSearchParams(window.location.search)
    const reference = params.get('reference') || params.get('payment_reference') || ''
    async function check() {
      if (!reference) { setMessage('No payment reference was supplied. Check your tournament entry history.'); setState('unknown'); return }
      const { data: { session } } = await getSupabase().auth.getSession()
      if (!session?.access_token) { setMessage('Sign in with the account used for payment to view its status.'); setState('unknown'); return }
      const response = await fetch('/api/tournaments/payment-status?reference=' + encodeURIComponent(reference), { headers: { Authorization: 'Bearer ' + session.access_token }, cache: 'no-store' })
      const result = await response.json()
      if (cancelled) return
      if (!response.ok) { setMessage(result.error || 'Payment status is not available yet.'); setState('unknown'); return }
      if (result.payment.payment_status === 'paid') { setMessage('Payment confirmed. Your tournament entry is registered.'); setState('success'); clearInterval(interval) }
      else if (['failed','initialization_failed','refunded'].includes(result.payment.payment_status)) { setMessage('This payment was not completed. Your tournament entry is not active.'); setState('failed'); clearInterval(interval) }
      else { setMessage('Payment is still pending. This page will check again automatically.'); setState('pending') }
    }
    check()
    interval = setInterval(check, 4000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return <main className="auth-screen"><section className="auth-card"><p className="eyebrow">SHADOW STRIKE • TOURNAMENTS</p><h1>PAYMENT STATUS</h1><p>{message}</p><Link href="/" style={{ color: '#86d9ff' }}>Return to Shadow Strike</Link></section></main>
}
