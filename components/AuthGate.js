'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '../lib/supabase'
import GameShell from './GameShell'

export default function AuthGate() {
  const [session, setSession] = useState(null)
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) {
      setMessage('Supabase is not configured yet.')
      setBusy(false)
      return undefined
    }

    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setBusy(false)
    })

    const hash = window.location.hash
    if (hash.includes('error_code=otp_expired')) {
      setMessage('That confirmation link has expired or was already opened. Create a fresh confirmation email and open the newest link once.')
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
    } else if (hash.includes('error=access_denied')) {
      setMessage('Email confirmation could not be completed. Please request a new confirmation email.')
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.user) return
    const supabase = getSupabase()
    if (!supabase) return
    const suggested = String(session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Player').trim()
    const safeName = suggested.length >= 2 ? suggested.slice(0, 24) : 'Player'
    supabase.from('profiles').upsert({ id: session.user.id, display_name: safeName }, { onConflict: 'id' }).then(({ error }) => {
      if (error) console.error('Profile sync failed:', error)
    })
  }, [session])

  async function resendConfirmation() {
    const supabase = getSupabase()
    const target = email.trim()
    if (!supabase || !target) {
      setMessage('Enter your registration email first.')
      return
    }
    setBusy(true)
    setMessage('Sending a fresh confirmation email…')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: target,
      options: { emailRedirectTo: window.location.origin },
    })
    setMessage(error ? error.message : 'Fresh confirmation email sent. Open only the newest email link once.')
    setBusy(false)
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    const supabase = getSupabase()
    if (!supabase) {
      setMessage('Supabase is not configured yet.')
      setBusy(false)
      return
    }

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        if (/confirm|verified|email/i.test(error.message)) {
          setMessage(`${error.message} You can request a fresh confirmation email below.`)
        } else {
          setMessage(error.message)
        }
      } else {
        setMessage('Login successful.')
      }
    } else {
      const callsign = displayName.trim() || email.trim().split('@')[0] || 'Player'
      const safeCallsign = callsign.length >= 2 ? callsign.slice(0, 24) : 'Player'
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: safeCallsign },
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) {
        setMessage(error.message)
      } else if (data.session) {
        setMessage('Account created.')
      } else {
        setMessage('Account created. Check your email and open the newest confirmation link once, then log in.')
      }
    }
    setBusy(false)
  }

  async function logout() {
    const supabase = getSupabase()
    if (supabase) await supabase.auth.signOut()
  }

  if (session) {
    return (
      <>
        <div className="account-bar">
          <span>PLAYER: {session.user.email}</span>
          <button type="button" onClick={logout}>LOG OUT</button>
        </div>
        <GameShell />
      </>
    )
  }

  return (
    <section className="auth-screen">
      <div className="auth-card">
        <div className="eyebrow">SHADOW STRIKE // PLAYER ACCESS</div>
        <h1>{mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}</h1>
        <p>Sign in to save your campaign scores to the Shadow Strike leaderboard.</p>
        <form onSubmit={submit}>
          {mode === 'signup' && (
            <label>
              CALLSIGN
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your callsign" maxLength={30} />
            </label>
          )}
          <label>
            EMAIL
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
          </label>
          <label>
            PASSWORD
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
          </label>
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? 'PLEASE WAIT…' : mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}
          </button>
        </form>
        <button className="auth-switch" type="button" onClick={resendConfirmation} disabled={busy}>
          RESEND CONFIRMATION EMAIL
        </button>
        {message && <div className="auth-message" role="status">{message}</div>}
        <button className="auth-switch" type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }}>
          {mode === 'login' ? 'Need an account? CREATE ONE' : 'Already registered? LOGIN'}
        </button>
      </div>
    </section>
  )
}
