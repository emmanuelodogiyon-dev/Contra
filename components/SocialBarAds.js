'use client'

import { useEffect } from 'react'

const SCRIPT_SRC = 'https://pl31341524.profitableratecpmnetwork.com/be/07/72/be077243b749930a02e277af96dcaa5b.js'

export default function SocialBarAds({ active }) {
  useEffect(() => {
    if (!active) return undefined
    const marker = 'data-shadow-strike-socialbar'
    if (document.querySelector(`[${marker}]`)) return undefined

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.setAttribute(marker, 'true')
    document.body.appendChild(script)

    return () => script.remove()
  }, [active])

  return null
}
