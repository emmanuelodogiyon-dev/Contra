'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '../lib/supabase'

const DEMO_EVENTS = [
  { id: 'daily', name: 'Daily Strike', mode: 'Solo score challenge', players: '2–32 players' },
  { id: 'squad', name: 'Squad Elimination', mode: 'Competitive survival', players: '4–16 players' },
]

export default function TournamentLobby() {
  const [notice, setNotice] = useState('')
  const [events, setEvents] = useState([])
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [register, setRegister] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    fetch('/api/tournaments/events', { cache: 'no-store' }).then(r => r.json()).then(data => setEvents(data.events || [])).catch(() => setNotice('Cash tournament listings are temporarily unavailable.'))
    return () => listener.subscription.unsubscribe()
  }, [])

  async function authenticate(event) {
    event.preventDefault()
    setBusy(true); setNotice('')
    try {
      const supabase = getSupabase()
      const result = register
        ? await supabase.auth.signUp({ email, password, options: { data: { full_name: displayName } } })
        : await supabase.auth.signInWithPassword({ email, password })
      if (result.error) throw result.error
      if (register && !result.data.session) setNotice('Account created. Check your email to confirm it, then sign in.')
      else setNotice(register ? 'Account created and signed in.' : 'Signed in successfully.')
    } catch (error) { setNotice(error.message || 'Unable to authenticate.') }
    finally { setBusy(false) }
  }

  async function enterTournament(tournamentId) {
    if (!session?.access_token) { setNotice('Sign in or create a player account before entering a cash tournament.'); return }
    setBusy(true); setNotice('Preparing secure Kora checkout…')
    try {
      const response = await fetch('/api/tournaments/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
        body: JSON.stringify({ tournamentId }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not start payment.')
      window.location.assign(result.checkoutUrl)
    } catch (error) { setNotice(error.message || 'Unable to start checkout.'); setBusy(false) }
  }

  async function signOut() { await getSupabase().auth.signOut(); setNotice('You have signed out.') }

  return (
    <section className="tournament-panel" aria-labelledby="tournament-title">
      <div className="tournament-heading">
        <div>
          <p className="tournament-kicker">SHADOW STRIKE COMPETITIVE</p>
          <h2 id="tournament-title">Tournament Arena</h2>
          <p className="tournament-subtitle">Join skill-based competitions. Payments are processed through Kora and entries activate only after verified payment confirmation.</p>
        </div>
        <span className="tournament-status">KORA CHECKOUT</span>
      </div>

      <div className="tournament-notice" role="status">
        <strong>Cash competitions are switched off by default.</strong>
        <span>Only operator-approved events marked open and cash-enabled will appear here. Payment keys, account verification, game-result validation and payout controls must be configured before launch.</span>
      </div>

      <div className="tournament-account">
        {session ? <div className="tournament-account-row"><span>Signed in as <strong>{session.user.email}</strong></span><button type="button" onClick={signOut}>Sign out</button></div> : <form onSubmit={authenticate} className="tournament-auth-form">
          <h3>{register ? 'Create player account' : 'Player sign in'}</h3>
          {register && <label>Display name<input required minLength={2} maxLength={24} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your player name" /></label>}
          <label>Email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
          <label>Password<input required type="password" minLength={8} autoComplete={register ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" /></label>
          <button className="tournament-join" disabled={busy} type="submit">{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button>
          <button className="tournament-auth-switch" type="button" onClick={() => { setRegister(!register); setNotice('') }}>{register ? 'Already have an account? Sign in' : 'New player? Create an account'}</button>
        </form>}
      </div>

      <h3 className="tournament-section-title">Cash tournaments</h3>
      {events.length ? <div className="tournament-grid">{events.map(event => <article className="tournament-card" key={event.id}>
        <div className="tournament-card-top"><span>REGISTRATION OPEN</span><span>{event.currency}</span></div>
        <h3>{event.name}</h3><p>{event.description || 'Compete for a place on the leaderboard.'}</p>
        <dl><div><dt>Entry fee</dt><dd>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: event.currency, maximumFractionDigits: 2 }).format(event.entry_fee_minor / 100)}</dd></div><div><dt>Players</dt><dd>Up to {event.max_players}</dd></div><div><dt>Starts</dt><dd>{event.starts_at ? new Date(event.starts_at).toLocaleString() : 'To be announced'}</dd></div></dl>
        <button className="tournament-join" type="button" disabled={busy} onClick={() => enterTournament(event.id)}>Pay entry with Kora</button>
      </article>)}</div> : <p className="tournament-empty">No cash tournaments are open for registration yet. Your tournament system is installed; create and approve an event when the payment and competition settings are ready.</p>}

      <h3 className="tournament-section-title">Free practice</h3>
      <div className="tournament-grid">{DEMO_EVENTS.map(event => <article className="tournament-card" key={event.id}><div className="tournament-card-top"><span>OPEN PRACTICE</span><span>FREE</span></div><h3>{event.name}</h3><p>{event.mode}</p><dl><div><dt>Players</dt><dd>{event.players}</dd></div><div><dt>Entry</dt><dd>No entry fee</dd></div><div><dt>Reward</dt><dd>Practice leaderboard</dd></div></dl><span className="tournament-practice-note">Practice mode only</span></article>)}</div>
      {notice && <p className="tournament-feedback" role="status">{notice}</p>}
      <div className="tournament-roadmap"><h3>Player protection</h3><ul><li>Authenticated player accounts</li><li>Payment confirmation through signed Kora webhooks</li><li>Duplicate-payment protection and transaction records</li><li>Server-verified scores and anti-cheat checks before prize decisions</li><li>Admin-reviewed prize approvals, refunds and payouts</li><li>Age/identity checks and responsible-play controls before cash launch</li></ul></div>
    </section>
  )
}
