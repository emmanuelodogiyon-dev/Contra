'use client'

import { useEffect, useRef, useState } from 'react'
import { saveScore } from '../lib/scores'

const W = 960, H = 540

export default function GameShell() {
  const canvasRef = useRef(null)
  const [started, setStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const controlsRef = useRef(new Set())

  useEffect(() => {
    if (!started) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf = 0, last = performance.now(), spawnTimer = 0, localScore = 0, localLives = 3
    const keys = controlsRef.current
    const player = { x: 120, y: 410, w: 34, h: 58, vx: 0, vy: 0, grounded: false, facing: 1, cooldown: 0, invuln: 0 }
    const bullets = [], enemies = [], particles = []
    let camera = 0

    const down = e => { keys.add(e.code); if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault() }
    const up = e => keys.delete(e.code)
    addEventListener('keydown', down); addEventListener('keyup', up)

    function rect(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y }
    function burst(x, y) { for (let i = 0; i < 12; i++) particles.push({ x, y, vx: (Math.random() - .5) * 240, vy: (Math.random() - .8) * 240, t: .5 + Math.random() * .5 }) }
    function shoot() {
      if (player.cooldown > 0) return
      bullets.push({ x: player.x + (player.facing > 0 ? player.w : -12), y: player.y + 25, w: 14, h: 4, vx: player.facing * 680 })
      player.cooldown = .14
    }
    function spawnEnemy() { enemies.push({ x: camera + W + 80 + Math.random() * 220, y: 420, w: 34, h: 48, vx: -75 - Math.random() * 55, hp: 2, bob: Math.random() * 6 }) }

    function update(dt) {
      player.cooldown = Math.max(0, player.cooldown - dt)
      player.invuln = Math.max(0, player.invuln - dt)
      const left = keys.has('ArrowLeft') || keys.has('KeyA') || keys.has('PadLeft')
      const right = keys.has('ArrowRight') || keys.has('KeyD') || keys.has('PadRight')
      player.vx = (right - left) * 235
      if (player.vx) player.facing = Math.sign(player.vx)
      if ((keys.has('ArrowUp') || keys.has('KeyW') || keys.has('PadJump')) && player.grounded) { player.vy = -480; player.grounded = false }
      if (keys.has('Space') || keys.has('KeyJ') || keys.has('PadFire')) shoot()
      player.vy += 1100 * dt; player.x += player.vx * dt; player.y += player.vy * dt
      if (player.y + player.h >= 468) { player.y = 468 - player.h; player.vy = 0; player.grounded = true }
      player.x = Math.max(camera + 20, player.x)
      if (player.x - camera > W * .56) camera = player.x - W * .56

      bullets.forEach(b => { b.x += b.vx * dt })
      spawnTimer -= dt
      if (spawnTimer <= 0) { spawnEnemy(); spawnTimer = .65 + Math.random() * 1.05 }
      enemies.forEach(e => { e.x += e.vx * dt; e.y = 420 + Math.sin(performance.now() / 240 + e.bob) * 1.5; if (e.x < camera - 80) e.hp = 0 })

      for (const b of bullets) for (const e of enemies) if (e.hp > 0 && rect(b, e)) { e.hp--; b.dead = true; burst(b.x, b.y); if (e.hp <= 0) { localScore += 100; setScore(localScore) } }
      if (player.invuln <= 0) for (const e of enemies) if (e.hp > 0 && rect(player, e)) {
        e.hp = 0; localLives--; player.invuln = 1.2; setLives(localLives); burst(player.x + 17, player.y + 28)
        if (localLives <= 0) { setStarted(false); saveScore(localScore) }
      }

      particles.forEach(p => { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt })
      for (let i = bullets.length - 1; i >= 0; i--) if (bullets[i].dead || Math.abs(bullets[i].x - player.x) > 1100) bullets.splice(i, 1)
      for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].hp <= 0) enemies.splice(i, 1)
      for (let i = particles.length - 1; i >= 0; i--) if (particles[i].t <= 0) particles.splice(i, 1)
    }

    function drawSoldier() {
      if (player.invuln > 0 && Math.floor(player.invuln * 12) % 2 === 0) return
      const x = player.x, y = player.y, f = player.facing
      ctx.save(); ctx.translate(x + player.w / 2, y); ctx.scale(f, 1)
      ctx.fillStyle = '#17222b'; ctx.fillRect(-12, 1, 24, 12)
      ctx.fillStyle = '#b89a72'; ctx.fillRect(-9, 12, 18, 15)
      ctx.fillStyle = '#394b3c'; ctx.fillRect(-14, 26, 28, 20)
      ctx.fillStyle = '#56654a'; ctx.fillRect(-12, 29, 24, 7)
      ctx.fillStyle = '#2d3537'; ctx.fillRect(-11, 45, 9, 11); ctx.fillRect(2, 45, 9, 11)
      ctx.fillStyle = '#11171b'; ctx.fillRect(-14, 55, 12, 3); ctx.fillRect(2, 55, 12, 3)
      ctx.fillStyle = '#b89a72'; ctx.fillRect(8, 29, 13, 7)
      ctx.fillStyle = '#20262a'; ctx.fillRect(17, 30, 24, 5); ctx.fillRect(38, 29, 5, 7)
      ctx.fillStyle = '#111'; ctx.fillRect(-6, 16, 3, 3); ctx.fillRect(3, 16, 3, 3)
      ctx.restore()
    }

    function draw() {
      ctx.fillStyle = '#07111f'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#0d2a35'; for (let i = 0; i < 12; i++) { let x = (i * 160 - camera * .15) % 1200; ctx.fillRect(x, 180 - (i % 3) * 24, 110, 288) }
      ctx.fillStyle = '#173f46'; for (let i = 0; i < 20; i++) { let x = (i * 90 - camera * .35) % 1100; ctx.fillRect(x, 300 - (i % 4) * 20, 60, 168) }
      ctx.fillStyle = '#25352f'; ctx.fillRect(0, 468, W, 72)
      ctx.save(); ctx.translate(-camera, 0)
      for (let x = Math.floor(camera / 160) * 160; x < camera + W + 200; x += 160) { ctx.fillStyle = '#4c5c3f'; ctx.fillRect(x, 455, 120, 13) }
      drawSoldier()
      ctx.fillStyle = '#ffef99'; bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h))
      enemies.forEach(e => { ctx.fillStyle = '#9b3d3d'; ctx.fillRect(e.x, e.y, e.w, e.h); ctx.fillStyle = '#2a2025'; ctx.fillRect(e.x + 7, e.y + 8, 20, 12); ctx.fillStyle = '#b89a72'; ctx.fillRect(e.x + 9, e.y + 11, 3, 3); ctx.fillRect(e.x + 20, e.y + 11, 3, 3); ctx.fillStyle = '#20262a'; ctx.fillRect(e.x - 10, e.y + 25, 12, 5) })
      particles.forEach(p => { ctx.globalAlpha = Math.max(0, p.t * 1.5); ctx.fillStyle = '#ffb347'; ctx.fillRect(p.x, p.y, 5, 5) }); ctx.globalAlpha = 1
      ctx.restore()
      ctx.fillStyle = '#fff'; ctx.font = '700 18px monospace'; ctx.fillText(`SCORE ${String(localScore).padStart(6, '0')}`, 24, 32); ctx.fillText(`LIVES ${localLives}`, W - 130, 32)
      ctx.fillStyle = '#9fd3ff'; ctx.font = '14px monospace'; ctx.fillText('A/D or arrows: move  •  W/UP: jump  •  J/SPACE: fire', 24, H - 18)
    }
    function loop(now) { const dt = Math.min((now - last) / 1000, .033); last = now; update(dt); draw(); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', down); removeEventListener('keyup', up); keys.clear() }
  }, [started])

  const press = code => e => { e.preventDefault(); controlsRef.current.add(code) }
  const release = code => e => { e.preventDefault(); controlsRef.current.delete(code) }
  const bind = code => ({ onPointerDown: press(code), onPointerUp: release(code), onPointerCancel: release(code), onPointerLeave: release(code), onContextMenu: e => e.preventDefault() })

  return <section className="shell">
    <header><div><span className="eyebrow">ORIGINAL HUMAN SOLDIER RUN-AND-GUN</span><h1>SHADOW STRIKE</h1></div><div className="hud"><b>{score}</b><span>score</span><b>{lives}</b><span>lives</span></div></header>
    <div className="ad-slot" aria-label="advertisement"><span>ADVERTISEMENT</span><small>Responsive banner slot — connect your approved ad network ID here.</small></div>
    <div className="game-frame">
      <canvas ref={canvasRef} width={W} height={H}/>
      {!started && <div className="overlay"><h2>{lives <= 0 ? 'MISSION FAILED' : 'READY?'}</h2><p>Use the gamepad below on phone, tablet, or touchscreen. Keyboard also works on desktop.</p><button onClick={() => { setScore(0); setLives(3); controlsRef.current.clear(); setStarted(true) }}>START MISSION</button></div>}
      {started && <div className="gamepad" aria-label="Game controls">
        <div className="pad-left">
          <button className="pad-btn pad-left-btn" aria-label="Move left" {...bind('PadLeft')}>◀</button>
          <button className="pad-btn pad-right-btn" aria-label="Move right" {...bind('PadRight')}>▶</button>
        </div>
        <div className="pad-right">
          <button className="pad-btn pad-jump-btn" aria-label="Jump" {...bind('PadJump')}>▲</button>
          <button className="pad-btn pad-fire-btn" aria-label="Fire" {...bind('PadFire')}>FIRE</button>
        </div>
      </div>}
    </div>
    <div className="monetization"><div><strong>Rewarded continue</strong><p>Reserve a single revive for a completed rewarded-ad event from an approved provider.</p></div><div><strong>Supabase leaderboard</strong><p>Scores are stored securely for authenticated users with row-level security enabled.</p></div></div>
  </section>
}
