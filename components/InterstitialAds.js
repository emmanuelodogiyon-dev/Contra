'use client'

import { useEffect } from 'react'

const INTERSTITIAL_URL = 'https://www.profitableratecpmnetwork.com/qyxm9pnb5?key=b1b20a6eddb68facab4036f0c949aa49'

export default function InterstitialAds() {
  useEffect(() => {
    let lastShown = 0
    const onClick = (event) => {
      const button = event.target?.closest?.('button')
      if (!button) return
      const label = (button.textContent || '').trim().toUpperCase()
      if (!/^(START CAMPAIGN|RESTART CAMPAIGN|PLAY AGAIN)$/.test(label)) return
      const now = Date.now()
      if (now - lastShown < 30000) return
      lastShown = now
      window.open(INTERSTITIAL_URL, '_blank', 'noopener,noreferrer')
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
