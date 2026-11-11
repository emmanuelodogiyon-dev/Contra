'use client'

import { useState } from 'react'

const DEMO_EVENTS = [
  { id: 'daily', name: 'Daily Strike', mode: 'Solo score challenge', players: '2–32 players', prize: 'Practice leaderboard', fee: 'No entry fee' },
  { id: 'squad', name: 'Squad Elimination', mode: 'Competitive survival', players: '4–16 players', prize: 'Practice leaderboard', fee: 'No entry fee' },
]

export default function TournamentLobby() {
  const [notice, setNotice] = useState('')
  return (
    <section className="tournament-panel" aria-labelledby="tournament-title">
      <div className="tournament-heading">
        <div>
          <p className="tournament-kicker">SHADOW STRIKE COMPETITIVE</p>
          <h2 id="tournament-title">Tournament Arena</h2>
          <p className="tournament-subtitle">Compete on the leaderboard. Practice tournaments are free while the regulated cash competition system is being prepared.</p>
        </div>
        <span className="tournament-status">PRACTICE MODE</span>
      </div>

      <div className="tournament-notice" role="status">
        <strong>Real-money entry and cash prizes are currently disabled.</strong>
        <span>They will remain disabled until the required gaming authorisation, payment-provider approval, secure player accounts and payout controls are in place.</span>
      </div>

      <div className="tournament-grid">
        {DEMO_EVENTS.map((event) => (
          <article className="tournament-card" key={event.id}>
            <div className="tournament-card-top"><span>OPEN PRACTICE</span><span>FREE</span></div>
            <h3>{event.name}</h3>
            <p>{event.mode}</p>
            <dl>
              <div><dt>Players</dt><dd>{event.players}</dd></div>
              <div><dt>Entry</dt><dd>{event.fee}</dd></div>
              <div><dt>Reward</dt><dd>{event.prize}</dd></div>
            </dl>
            <button type="button" className="tournament-join" onClick={() => setNotice('Practice registration is not connected yet. Player accounts and server-verified match records must be enabled first.')}>Practice registration</button>
          </article>
        ))}
      </div>

      {notice && <p className="tournament-feedback" role="status">{notice}</p>}

      <div className="tournament-roadmap">
        <h3>Competition system</h3>
        <ul>
          <li>Player accounts and identity/age checks</li>
          <li>Entry-fee collection through an approved gaming payment provider</li>
          <li>Server-verified scores, rankings and anti-cheat checks</li>
          <li>Auditable prize-pool ledger and refunds</li>
          <li>Admin-reviewed winner approval and traceable payouts</li>
          <li>Responsible-play controls, complaints and transaction history</li>
        </ul>
      </div>
    </section>
  )
}
