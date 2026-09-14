'use client'

import { useEffect, useRef } from 'react'

function mountAdCode(container, code) {
  if (!container || !code?.trim()) return false
  container.innerHTML = ''

  const template = document.createElement('template')
  template.innerHTML = code
  const nodes = Array.from(template.content.childNodes)

  nodes.forEach((node) => {
    if (node.nodeName === 'SCRIPT') {
      const script = document.createElement('script')
      Array.from(node.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value))
      script.text = node.textContent || ''
      container.appendChild(script)
    } else {
      container.appendChild(node.cloneNode(true))
    }
  })

  return true
}

export default function AdsterraAds() {
  const nativeRef = useRef(null)

  useEffect(() => {
    const bannerCode = process.env.NEXT_PUBLIC_ADSTERRA_BANNER_CODE
    const nativeCode = process.env.NEXT_PUBLIC_ADSTERRA_NATIVE_CODE
    const socialBarCode = process.env.NEXT_PUBLIC_ADSTERRA_SOCIALBAR_CODE

    // The existing Shadow Strike .ad-slot is the main banner position.
    const bannerSlot = document.querySelector('.ad-slot')
    if (bannerSlot && bannerCode?.trim()) {
      mountAdCode(bannerSlot, bannerCode)
    }

    // Social Bar is a page-level script and should only be mounted once.
    if (socialBarCode?.trim() && !document.querySelector('[data-shadow-strike-socialbar]')) {
      const holder = document.createElement('div')
      holder.dataset.shadowStrikeSocialbar = 'true'
      holder.setAttribute('aria-hidden', 'true')
      holder.style.display = 'contents'
      document.body.appendChild(holder)
      mountAdCode(holder, socialBarCode)
    }

    if (nativeRef.current && nativeCode?.trim()) {
      mountAdCode(nativeRef.current, nativeCode)
    }

    return () => {
      const holder = document.querySelector('[data-shadow-strike-socialbar]')
      holder?.remove()
    }
  }, [])

  return (
    <div className="adsterra-native-wrap" aria-label="Advertisement">
      <div ref={nativeRef} id="adsterra-native-slot" className="adsterra-native-slot">
        <span>ADVERTISEMENT</span>
        <small>Adsterra native slot — add your approved code to NEXT_PUBLIC_ADSTERRA_NATIVE_CODE.</small>
      </div>
    </div>
  )
}
