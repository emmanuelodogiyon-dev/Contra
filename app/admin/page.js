'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '../../lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [busy,setBusy] = useState(false)
  const [notice,setNotice] = useState('Private administrator access only.')

  async function signIn(event) {
    event.preventDefault()
    setBusy(true); setNotice('')
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw error
      const response = await fetch('/api/admin/tournaments', {
        headers: { Authorization: 'Bearer ' + data.session.access_token },
        cache: 'no-store'
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        await supabase.auth.signOut()
        throw new Error(result.error || 'This account is not authorized as an administrator.')
      }
      router.replace('/admin/tournaments')
    } catch (error) {
      setNotice(error.message || 'Unable to sign in.')
    } finally { setBusy(false) }
  }

  return <main className="admin-page"><section className="auth-card admin-login-card">
    <p className="eyebrow">SHADOW STRIKE • SECURE OPERATIONS</p>
    <h1>ADMIN LOGIN</h1>
    <p>Private access for the game administrator. Player accounts cannot access this dashboard.</p>
    <form onSubmit={signIn}>
      <label>Email address<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
      <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>
      <button className="auth-submit" disabled={busy}>{busy?'VERIFYING…':'SIGN IN TO ADMIN'}</button>
    </form>
    <p className="auth-message" role="status">{notice}</p>
    <a className="admin-back" href="/">← Return to player game</a>
  </section></main>
}
