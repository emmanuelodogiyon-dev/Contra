'use client'

import { useEffect, useRef } from 'react'

const SCRIPT_SRC = 'https://pl31341523.profitableratecpmnetwork.com/8e8816e9ca87ebe84acd22b75d1d098d/invoke.js'
const CONTAINER_ID = 'container-8e8816e9ca87ebe84acd22b75d1d098d'

export default function NativeBanner(){
  const containerRef=useRef(null)

  useEffect(()=>{
    const container=containerRef.current
    if(!container||container.dataset.loaded)return
    container.dataset.loaded='true'
    const script=document.createElement('script')
    script.async=true
    script.setAttribute('data-cfasync','false')
    script.src=SCRIPT_SRC
    container.appendChild(script)
    return()=>{container.replaceChildren();delete container.dataset.loaded}
  },[])

  return <div className="native-banner" aria-label="Advertisement"><div ref={containerRef} id={CONTAINER_ID}/></div>
}
