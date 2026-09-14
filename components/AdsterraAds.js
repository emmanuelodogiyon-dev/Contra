'use client'

import { useEffect } from 'react'

const SOCIAL_BAR_CODE = `<script src="https://pl31333770.profitableratecpmnetwork.com/4c/1d/79/4c1d795ce496ee030b848c66e15069b5.js"></script>`

export default function AdsterraAds() {
  useEffect(() => {
    if (document.querySelector('[data-shadow-strike-socialbar]')) return undefined

    const holder = document.createElement('div')
    holder.dataset.shadowStrikeSocialbar = 'true'
    holder.setAttribute('aria-hidden', 'true')
    holder.style.display = 'contents'
    document.body.appendChild(holder)

    const script = document.createElement('script')
    script.src = 'https://pl31333770.profitableratecpmnetwork.com/4c/1d/79/4c1d795ce496ee030b848c66e15069b5.js'
    script.async = true
    script.dataset.shadowStrikeAd = 'socialbar'
    holder.appendChild(script)

    return () => holder.remove()
  }, [])

  return null
}
