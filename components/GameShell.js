'use client'

import { useEffect, useRef, useState } from 'react'
import { saveScore } from '../lib/scores'

const W = 960, H = 540

export default function GameShell() {
  const canvasRef = useRef(null)
  const [started, setStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)

  useEffect(() => {
    if (!started) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf = 0, last = performance.now(), spawnTimer = 0, localScore = 0, localLives = 3
    const keys = new Set()
    const player = { x: 120, y: 420, w: 34, h: 48, vx: 0, vy: 0, grounded: false, facing: 1, cooldown: 0 }
    const bullets = [], enemies = [], particles = []
    let camera = 0

    const down = e => { keys.add(e.code); if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault() }
    const up = e => keys.delete(e.code)
    addEventListener('keydown', down); addEventListener('keyup', up)

    function rect(a,b){ return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y }
    function shoot(){
      if (player.cooldown > 0) return
      bullets.push({x:player.x+(player.facing>0?player.w:0), y:player.y+19, w:12,h:4,vx:player.facing*620})
      player.cooldown=.16
    }
    function spawnEnemy(){ enemies.push({x:camera+W+80+Math.random()*220,y:424,w:34,h:44,vx:-75-Math.random()*50,hp:2}) }
    function burst(x,y){ for(let i=0;i<10;i++) particles.push({x,y,vx:(Math.random()-.5)*220,vy:(Math.random()-.8)*220,t:.5+Math.random()*.4}) }

    function update(dt){
      player.cooldown=Math.max(0,player.cooldown-dt)
      const left=keys.has('ArrowLeft')||keys.has('KeyA'), right=keys.has('ArrowRight')||keys.has('KeyD')
      player.vx=(right-left)*230; if(player.vx) player.facing=Math.sign(player.vx)
      if((keys.has('ArrowUp')||keys.has('KeyW'))&&player.grounded){ player.vy=-470; player.grounded=false }
      if(keys.has('Space')||keys.has('KeyJ')) shoot()
      player.vy+=1050*dt; player.x+=player.vx*dt; player.y+=player.vy*dt
      if(player.y+player.h>=468){player.y=468-player.h;player.vy=0;player.grounded=true}
      player.x=Math.max(camera+20,player.x)
      if(player.x-camera>W*.56) camera=player.x-W*.56
      bullets.forEach(b=>{b.x+=b.vx*dt})
      spawnTimer-=dt; if(spawnTimer<=0){spawnEnemy();spawnTimer=.7+Math.random()*1.2}
      enemies.forEach(e=>{e.x+=e.vx*dt; if(e.x<camera-80)e.hp=0})
      for(const b of bullets) for(const e of enemies) if(e.hp>0&&rect(b,e)){e.hp--;b.dead=true;burst(b.x,b.y); if(e.hp<=0){localScore+=100;setScore(localScore)}}
      for(const e of enemies) if(e.hp>0&&rect(player,e)){e.hp=0;localLives--;setLives(localLives);burst(player.x+18,player.y+20);player.x=camera+80;if(localLives<=0){setStarted(false);saveScore(localScore)}}
      particles.forEach(p=>{p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt})
      for(let i=bullets.length-1;i>=0;i--) if(bullets[i].dead||Math.abs(bullets[i].x-player.x)>1100) bullets.splice(i,1)
      for(let i=enemies.length-1;i>=0;i--) if(enemies[i].hp<=0) enemies.splice(i,1)
      for(let i=particles.length-1;i>=0;i--) if(particles[i].t<=0) particles.splice(i,1)
    }

    function draw(){
      ctx.fillStyle='#07111f';ctx.fillRect(0,0,W,H)
      ctx.fillStyle='#0d2a35'; for(let i=0;i<12;i++){let x=(i*160-camera*.15)%1200;ctx.fillRect(x,180-(i%3)*24,110,288)}
      ctx.fillStyle='#173f46'; for(let i=0;i<20;i++){let x=(i*90-camera*.35)%1100;ctx.fillRect(x,300-(i%4)*20,60,168)}
      ctx.fillStyle='#25352f';ctx.fillRect(0,468,W,72)
      ctx.save();ctx.translate(-camera,0)
      for(let x=Math.floor(camera/160)*160;x<camera+W+200;x+=160){ctx.fillStyle='#4c5c3f';ctx.fillRect(x,455,120,13)}
      ctx.fillStyle='#e9d36b';ctx.fillRect(player.x,player.y,player.w,player.h);ctx.fillStyle='#202735';ctx.fillRect(player.x+8,player.y+10,18,16)
      ctx.fillStyle='#ffef99';bullets.forEach(b=>ctx.fillRect(b.x,b.y,b.w,b.h))
      enemies.forEach(e=>{ctx.fillStyle='#d35454';ctx.fillRect(e.x,e.y,e.w,e.h);ctx.fillStyle='#291b24';ctx.fillRect(e.x+7,e.y+8,20,12)})
      particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.t*1.5);ctx.fillStyle='#ffb347';ctx.fillRect(p.x,p.y,5,5)});ctx.globalAlpha=1
      ctx.restore()
      ctx.fillStyle='#fff';ctx.font='700 18px monospace';ctx.fillText(`SCORE ${String(localScore).padStart(6,'0')}`,24,32);ctx.fillText(`LIVES ${localLives}`,W-130,32)
      ctx.fillStyle='#9fd3ff';ctx.font='14px monospace';ctx.fillText('MOVE A/D or arrows  •  J/SPACE fire  •  W/UP jump',24,H-18)
    }
    function loop(now){const dt=Math.min((now-last)/1000,.033);last=now;update(dt);draw();raf=requestAnimationFrame(loop)}
    raf=requestAnimationFrame(loop)
    return()=>{cancelAnimationFrame(raf);removeEventListener('keydown',down);removeEventListener('keyup',up)}
  },[started])

  return <section className="shell">
    <header><div><span className="eyebrow">ORIGINAL RETRO RUN-AND-GUN</span><h1>SHADOW STRIKE</h1></div><div className="hud"><b>{score}</b><span>score</span><b>{lives}</b><span>lives</span></div></header>
    <div className="ad-slot" aria-label="advertisement"><span>ADVERTISEMENT</span><small>Responsive banner slot — connect your approved ad network ID here.</small></div>
    <div className="game-frame">
      <canvas ref={canvasRef} width={W} height={H}/>
      {!started && <div className="overlay"><h2>{lives<=0?'MISSION FAILED':'READY?'}</h2><p>Fight through enemy waves, earn score, and survive.</p><button onClick={()=>{setScore(0);setLives(3);setStarted(true)}}>START MISSION</button></div>}
    </div>
    <div className="monetization"><div><strong>Rewarded ad hook</strong><p>Grant one revive only after the ad network reports a completed rewarded view.</p></div><div><strong>Leaderboard-ready</strong><p>Supabase schema included for authenticated score submissions with RLS.</p></div></div>
  </section>
}
