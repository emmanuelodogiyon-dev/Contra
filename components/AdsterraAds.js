'use client'

import { useEffect } from 'react'

function mountAdCode(container, code) {
  if (!container || !code?.trim()) return false
  container.innerHTML = ''
  const template = document.createElement('template')
  template.innerHTML = code
  Array.from(template.content.childNodes).forEach((node) => {
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
  useEffect(() => {
    const socialBarCode = process.env.NEXT_PUBLIC_ADSTERRA_SOCIALBAR_CODE
    if (!socialBarCode?.trim()) return undefined

    const holder = document.createElement('div')
    holder.dataset.shadowStrikeSocialbar = 'true'
    holder.setAttribute('aria-hidden', 'true')
    holder.style.display = 'contents'
    document.body.appendChild(holder)
    mountAdCode(holder, socialBarCode)

    return () => holder.remove()
  }, [])

  return null
}
