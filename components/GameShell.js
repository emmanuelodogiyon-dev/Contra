'use client'

import { useEffect, useRef, useState } from 'react'
import { saveScore } from '../lib/scores'
import { createAudio } from '../lib/audio'

const W=960,H=540,GROUND=468
const LEVELS=[
  {name:'Outpost Assault',boss:'Armored Commander',length:3600,sky:'#07111f',far:'#0d2a35',near:'#173f46',ground:'#25352f',accent:'#4c5c3f'},
  {name:'Jungle Ambush',boss:'Jungle War Machine',length:3900,sky:'#071b17',far:'#123a2c',near:'#1c5a38',ground:'#263a2a',accent:'#557346'},
  {name:'Desert Convoy',boss:'Battle Tank',length:4200,sky:'#29170e',far:'#6e3c1f',near:'#9a6733',ground:'#5b4328',accent:'#c19854'},
  {name:'Underground Facility',boss:'Defense Core',length:4400,sky:'#090c18',far:'#20283c',near:'#33415f',ground:'#252a34',accent:'#56647a'},
  {name:'Enemy Fortress',boss:'Fortress Guardian',length:4700,sky:'#170a0d',far:'#431b21',near:'#69272e',ground:'#33262a',accent:'#82535a'},
  {name:'Final Strike',boss:'The Warlord',length:5000,sky:'#100815',far:'#35173f',near:'#552161',ground:'#2e2432',accent:'#744b7d'},
]
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n))
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y

export default function GameShell(){
  const canvasRef=useRef(null),controlsRef=useRef(new Set()),previousControlsRef=useRef(new Set())
  const [started,setStarted]=useState(false),[score,setScore]=useState(0),[lives,setLives]=useState(3),[level,setLevel]=useState(1),[status,setStatus]=useState('ready')

  useEffect(()=>{
    if(!started)return
    const canvas=canvasRef.current,ctx=canvas.getContext('2d'),keys=controlsRef.current,audio=createAudio();audio.start()
    let raf=0,last=performance.now(),gameTime=0,localScore=score,localLives=lives,levelIndex=Math.max(0,level-1)
    let camera=0,checkpoint=0,waveCursor=0,transition=2.2,bossSpawned=false,current=LEVELS[levelIndex],boss=null
    const player={x:120,y:GROUND-76,w:46,h:76,vx:0,vy:0,grounded:true,facing:1,cooldown:0,invuln:0}
    const bullets=[],enemyBullets=[],enemies=[],particles=[],pickups=[]
    const upperPlatforms=()=>{
      const step=levelIndex%2?620:700
      return Array.from({length:Math.ceil(current.length/step)},(_,i)=>({x:360+i*step,y:300-(i%3)*48,w:210+(i%2)*45,h:16}))
    }
    let platforms=upperPlatforms()
    const down=e=>{keys.add(e.code);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault()}
    const up=e=>keys.delete(e.code)
    addEventListener('keydown',down);addEventListener('keyup',up)
    const justPressed=code=>keys.has(code)&&!previousControlsRef.current.has(code)
    function burst(x,y,count=12){for(let i=0;i<count;i++)particles.push({x,y,vx:(Math.random()-.5)*260,vy:(Math.random()-.8)*260,t:.45+Math.random()*.65})}
    function shoot(){if(player.cooldown>0||transition>0)return;const gunX=player.x+(player.facing>0?player.w:-18);bullets.push({x:gunX,y:player.y+31,w:17,h:5,vx:player.facing*760,damage:1});player.cooldown=.13;audio.shot()}
    function enemyShot(e,speed=260){const dx=player.x+23-(e.x+e.w/2),dy=player.y+38-(e.y+e.h/2),d=Math.hypot(dx,dy)||1;enemyBullets.push({x:e.x+e.w/2,y:e.y+e.h/2,w:9,h:9,vx:dx/d*speed,vy:dy/d*speed});audio.enemyShot()}
    function platformAt(x,y,w){return platforms.find(p=>x+w*.5>p.x&&x+w*.5<p.x+p.w&&y+6>=p.y&&y+6<=p.y+p.h+20)}
    function spawnEnemy(type,x,spawn='ground'){
      const e={type,x,y:420,w:38,h:48,hp:2,vx:-70,vy:0,cooldown:.6+Math.random(),bob:Math.random()*6,spawn,landed:spawn==='ground',platform:null,drop:0}
      if(type==='runner')Object.assign(e,{hp:1,vx:-155,w:34,h:42,y:426})
      if(type==='turret')Object.assign(e,{hp:4,vx:0,w:42,h:36,y:432,cooldown:.5})
      if(type==='heavy')Object.assign(e,{hp:7,vx:-42,w:52,h:58,y:410,cooldown:1})
      if(spawn==='upper'){
        const candidates=platforms.filter(p=>p.x>x-180&&p.x<x+500)
        e.platform=candidates.length?candidates[Math.floor(Math.random()*candidates.length)]:null
        e.y=e.platform?e.platform.y-e.h:-e.h-20;e.x=e.platform?clamp(x,e.platform.x+8,e.platform.x+e.platform.w-e.w):x;e.vx=e.platform?e.vx:-35;e.vy=e.platform?0:110;e.landed=!!e.platform
      }
      if(spawn==='airdrop'){e.y=-e.h-25;e.vy=90;e.vx=-35;e.landed=false;e.drop=1}
      enemies.push(e)
    }
    function spawnWave(mark){
      const x=mark+720,d=levelIndex+1
      spawnEnemy('grunt',x)
      if(d>=2||mark>current.length*.3)spawnEnemy('runner',x+180)
      if(mark%900<250)spawnEnemy('turret',x+330)
      if(d>=3&&mark>current.length*.45)spawnEnemy('heavy',x+520)
      if(d>=2&&Math.floor(mark/560)%2===0)spawnEnemy(d>=4?'heavy':'grunt',x+340,'upper')
      if(d>=3&&Math.floor(mark/1120)%2===1)spawnEnemy('runner',x+620,'airdrop')
      if(d>=5)spawnEnemy(Math.random()>.5?'runner':'grunt',x+700,'upper')
    }
    function spawnBoss(){bossSpawned=true;const hp=28+levelIndex*10;boss={x:current.length+520,y:326,w:126,h:132,hp,maxHp:hp,cooldown:1,phase:1,alive:true};audio.boss()}
    function dropPickup(x,y){if(Math.random()<.24)pickups.push({x,y,w:24,h:24,type:Math.random()<.7?'medal':'life',vy:-130})}
    function damagePlayer(){if(player.invuln>0||transition>0)return;localLives--;setLives(localLives);player.invuln=1.4;burst(player.x+23,player.y+38,18);audio.damage();if(localLives<=0){setStatus('failed');setStarted(false);saveScore(localScore);audio.gameOver();return}player.x=Math.max(80,checkpoint+120);player.y=GROUND-player.h;player.vx=0;player.vy=0;player.grounded=true;camera=Math.max(0,checkpoint);enemies.splice(0);enemyBullets.splice(0);waveCursor=Math.max(waveCursor,checkpoint)}
    function nextLevel(){localScore+=1500+levelIndex*500;setScore(localScore);if(levelIndex===LEVELS.length-1){setStatus('victory');setStarted(false);saveScore(localScore);audio.victory();return}levelIndex++;current=LEVELS[levelIndex];setLevel(levelIndex+1);camera=0;checkpoint=0;waveCursor=0;bossSpawned=false;boss=null;platforms=upperPlatforms();bullets.splice(0);enemyBullets.splice(0);enemies.splice(0);pickups.splice(0);player.x=120;player.y=GROUND-player.h;player.vx=0;player.vy=0;player.grounded=true;player.invuln=1.4;transition=2.2;audio.level()}
    function updatePlayer(dt){
      const left=keys.has('ArrowLeft')||keys.has('KeyA')||keys.has('PadLeft'),right=keys.has('ArrowRight')||keys.has('KeyD')||keys.has('PadRight')
      player.vx=transition>0?0:(right-left)*245;if(player.vx)player.facing=Math.sign(player.vx)
      const jump=justPressed('ArrowUp')||justPressed('KeyW')||justPressed('PadJump');if(jump&&player.grounded&&transition<=0){player.vy=-500;player.grounded=false}
      if(keys.has('Space')||keys.has('KeyJ')||keys.has('PadFire'))shoot()
      const oldBottom=player.y+player.h;player.vy+=1120*dt;player.x+=player.vx*dt;player.y+=player.vy*dt;player.grounded=false
      if(player.y+player.h>=GROUND){player.y=GROUND-player.h;player.vy=0;player.grounded=true}
      if(player.vy>=0){for(const p of platforms){if(player.x+player.w>p.x&&player.x<p.x+p.w&&oldBottom<=p.y+8&&player.y+player.h>=p.y){player.y=p.y-player.h;player.vy=0;player.grounded=true;break}}}
      player.x=clamp(player.x,camera+20,boss?.alive?current.length+500:current.length+800)
      if(player.x-camera>W*.56)camera=Math.min(current.length+280,player.x-W*.56)
    }
    function updateEnemies(dt){
      enemies.forEach(e=>{
        e.cooldown-=dt
        if(!e.landed){e.vy+=760*dt;e.y+=e.vy*dt;const p=e.platform;if(p&&e.y+e.h>=p.y&&e.x+e.w>p.x&&e.x<p.x+p.w){e.y=p.y-e.h;e.vy=0;e.landed=true;e.vx=e.vx||-70}if(!p&&e.y+e.h>=GROUND){e.y=GROUND-e.h;e.vy=0;e.landed=true}}
        if(e.landed&&e.type!=='turret'){
          e.x+=e.vx*dt
          if(e.platform){if(e.x<e.platform.x||e.x+e.w>e.platform.x+e.platform.w)e.vx*=-1}
        }
        if((e.type==='turret'||e.type==='heavy'||levelIndex>=2)&&e.cooldown<=0&&Math.abs(e.x-player.x)<620&&Math.abs(e.y-player.y)<250){enemyShot(e,e.type==='heavy'?300:245+levelIndex*12);e.cooldown=e.type==='turret'?1.25:e.type==='heavy'?1.7:2.1}
        if((e.type==='grunt'||e.type==='runner')&&e.landed)e.y=(e.platform?e.platform.y-e.h:(e.type==='runner'?426:420))+Math.sin(gameTime*5+e.bob)*1.4
        if(e.x<camera-160)e.hp=0
      })
    }
    function update(dt){
      gameTime+=dt;transition=Math.max(0,transition-dt);player.cooldown=Math.max(0,player.cooldown-dt);player.invuln=Math.max(0,player.invuln-dt)
      updatePlayer(dt)
      while(waveCursor<current.length-700&&player.x>waveCursor-80){spawnWave(waveCursor);waveCursor+=560}
      if(player.x>current.length*.34&&checkpoint<current.length*.3)checkpoint=Math.floor(current.length*.3)
      if(player.x>current.length*.67&&checkpoint<current.length*.63)checkpoint=Math.floor(current.length*.63)
      if(!bossSpawned&&player.x>current.length-320)spawnBoss()
      bullets.forEach(b=>b.x+=b.vx*dt);enemyBullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt});pickups.forEach(p=>{p.vy+=520*dt;p.y+=p.vy*dt;if(p.y+p.h>GROUND){p.y=GROUND-p.h;p.vy=0}})
      updateEnemies(dt)
      if(boss?.alive){boss.phase=boss.hp<boss.maxHp*.34?3:boss.hp<boss.maxHp*.67?2:1;boss.cooldown-=dt;boss.y=326+Math.sin(gameTime*(1.5+boss.phase*.35))*(10+boss.phase*4);boss.x=current.length+470+Math.sin(gameTime*.8)*52;if(boss.cooldown<=0){for(let i=0;i<boss.phase;i++)enemyShot({x:boss.x,y:boss.y+32+i*25,w:boss.w,h:20},275+levelIndex*14+boss.phase*18);boss.cooldown=1.15-boss.phase*.13}}
      for(const b of bullets){for(const e of enemies)if(!b.dead&&e.hp>0&&hit(b,e)){e.hp-=b.damage;b.dead=true;burst(b.x,b.y,5);audio.hit();if(e.hp<=0){localScore+=e.type==='heavy'?350:e.type==='turret'?250:e.type==='runner'?150:100;setScore(localScore);dropPickup(e.x,e.y);audio.enemyDown()}}if(!b.dead&&boss?.alive&&hit(b,boss)){boss.hp-=b.damage;b.dead=true;burst(b.x,b.y,5);audio.hit();localScore+=20;setScore(localScore);if(boss.hp<=0){boss.alive=false;transition=2.4;burst(boss.x+boss.w/2,boss.y+boss.h/2,70);audio.bossDown()}}}
      if(player.invuln<=0){for(const e of enemies)if(e.hp>0&&hit(player,e)){e.hp=0;damagePlayer();break}for(const b of enemyBullets)if(!b.dead&&hit(player,b)){b.dead=true;damagePlayer();break}if(boss?.alive&&hit(player,boss))damagePlayer()}
      for(const p of pickups)if(!p.dead&&hit(player,p)){p.dead=true;audio.pickup();if(p.type==='life'){localLives=Math.min(5,localLives+1);setLives(localLives)}else{localScore+=300;setScore(localScore)}}
      if(boss&&!boss.alive&&transition<=0)nextLevel()
      particles.forEach(p=>{p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=520*dt})
      for(let i=bullets.length-1;i>=0;i--)if(bullets[i].dead||bullets[i].x<camera-100||bullets[i].x>camera+W+300)bullets.splice(i,1)
      for(let i=enemyBullets.length-1;i>=0;i--)if(enemyBullets[i].dead||enemyBullets[i].x<camera-140||enemyBullets[i].x>camera+W+200||enemyBullets[i].y>H+80||enemyBullets[i].y<-80)enemyBullets.splice(i,1)
      for(let i=enemies.length-1;i>=0;i--)if(enemies[i].hp<=0)enemies.splice(i,1)
      for(let i=pickups.length-1;i>=0;i--)if(pickups[i].dead||pickups[i].x<camera-100)pickups.splice(i,1)
      for(let i=particles.length-1;i>=0;i--)if(particles[i].t<=0)particles.splice(i,1)
      previousControlsRef.current=new Set(keys)
    }
    function drawHuman(x,y,f,kind='player',scale=1){ctx.save();ctx.translate(x,y);ctx.scale(f*scale,scale);const enemy=kind!=='player',skin=enemy?'#a9795f':'#c18b6c',hair=enemy?'#2b211e':'#984b29',armor=enemy?(kind==='heavy'?'#4c4248':kind==='runner'?'#674a32':'#44523f'):'#344936';ctx.fillStyle='#171c20';ctx.fillRect(-15,57,11,16);ctx.fillRect(4,57,11,16);ctx.fillStyle='#2d3930';ctx.fillRect(-17,72,14,4);ctx.fillRect(3,72,15,4);ctx.fillStyle='#26372d';ctx.fillRect(-17,42,34,20);ctx.fillStyle=armor;ctx.fillRect(-20,24,40,25);ctx.fillStyle='#697354';ctx.fillRect(-15,28,30,7);ctx.fillStyle='#1c2925';ctx.fillRect(-18,38,36,8);ctx.fillStyle=skin;ctx.fillRect(-6,19,12,9);ctx.fillStyle='#d8d4c7';ctx.fillRect(-12,20,24,7);ctx.fillStyle=skin;ctx.fillRect(-11,6,22,17);ctx.fillStyle=hair;ctx.fillRect(-13,3,26,9);ctx.fillRect(-10,1,20,5);if(!enemy){ctx.fillStyle='#813b25';ctx.fillRect(-10,16,20,10);ctx.fillRect(-7,23,14,5)}ctx.fillStyle='#171a1c';ctx.fillRect(-6,13,3,2);ctx.fillRect(3,13,3,2);ctx.fillStyle='#3c503d';ctx.fillRect(9,28,12,18);ctx.fillRect(-15,29,11,17);ctx.fillStyle='#171b1d';ctx.fillRect(8,31,37,6);ctx.fillRect(41,29,9,4);ctx.fillStyle='#8f6b55';ctx.fillRect(18,40,8,6);ctx.fillStyle=enemy?'#a93b35':'#b63c35';ctx.fillRect(-20,27,5,8);ctx.restore()}
    function drawEnemy(e){if(e.type==='turret'){ctx.fillStyle='#65717c';ctx.fillRect(e.x,e.y+8,e.w,e.h-8);ctx.fillStyle='#252b31';ctx.fillRect(e.x+7,e.y,e.w-14,12);ctx.fillStyle='#c94a4a';ctx.fillRect(e.x+e.w-3,e.y+12,10,5);return}drawHuman(e.x+e.w/2,e.y,1,e.type,e.type==='heavy'?1.08:1);if(!e.landed&&e.spawn==='airdrop'){ctx.strokeStyle='#d7d7d7';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x+e.w/2,e.y-16,20,Math.PI,0);ctx.stroke()}}
    function drawBoss(){if(!boss?.alive)return;drawHuman(boss.x+boss.w/2,boss.y,1,'heavy',1.7);ctx.fillStyle=current.accent;ctx.fillRect(boss.x-10,boss.y+48,20,36);ctx.fillStyle='#171a1d';ctx.fillRect(boss.x+34,boss.y+52,66,10)}
    function drawBackground(){ctx.fillStyle=current.sky;ctx.fillRect(0,0,W,H);ctx.fillStyle=current.far;for(let i=0;i<11;i++){const x=((i*180-camera*.14)%1260+1260)%1260-100;ctx.fillRect(x,175-(i%4)*22,125,293)}ctx.fillStyle=current.near;for(let i=0;i<17;i++){const x=((i*105-camera*.33)%1160+1160)%1160-80;ctx.fillRect(x,300-(i%5)*17,68,168)}if(levelIndex===1){ctx.fillStyle='#103b27';for(let i=0;i<10;i++)ctx.fillRect(((i*150-camera*.5)%1100+1100)%1100,345,16,123)}if(levelIndex===2){ctx.fillStyle='#d1a65d';ctx.beginPath();ctx.arc(790,105,52,0,Math.PI*2);ctx.fill()}if(levelIndex===3){ctx.fillStyle='#7ea0b3';for(let x=-50;x<W+100;x+=180)ctx.fillRect(x-(camera*.6%180),120,4,348)}ctx.fillStyle=current.ground;ctx.fillRect(0,GROUND,W,H-GROUND)}
    function draw(){
      drawBackground();ctx.save();ctx.translate(-camera,0)
      for(let x=Math.floor(camera/160)*160;x<camera+W+240;x+=160){ctx.fillStyle=current.accent;ctx.fillRect(x,455,120,13)}
      platforms.forEach(p=>{if(p.x+p.w>camera-30&&p.x<camera+W+30){ctx.fillStyle=current.accent;ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(p.x,p.y,p.w,3)}})
      drawHuman(player.x+player.w/2,player.y,player.facing,'player',1);ctx.fillStyle='#ffef99';bullets.forEach(b=>ctx.fillRect(b.x,b.y,b.w,b.h));ctx.fillStyle='#ff6b5f';enemyBullets.forEach(b=>ctx.fillRect(b.x,b.y,b.w,b.h));enemies.forEach(drawEnemy);drawBoss();pickups.forEach(p=>{ctx.fillStyle=p.type==='life'?'#78e08f':'#ffd86b';ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle='#17222b';ctx.font='bold 14px monospace';ctx.fillText(p.type==='life'?'+':'$',p.x+6,p.y+16)});particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.t*1.4);ctx.fillStyle='#ffb347';ctx.fillRect(p.x,p.y,5,5)});ctx.globalAlpha=1;ctx.restore()
      ctx.fillStyle='#fff';ctx.font='700 18px monospace';ctx.fillText(`SCORE ${String(localScore).padStart(6,'0')}`,24,31);ctx.fillText(`LIVES ${localLives}`,W-132,31);ctx.fillStyle='#9fd3ff';ctx.font='700 15px monospace';ctx.fillText(`LEVEL ${levelIndex+1}/6  ${current.name.toUpperCase()}`,24,56);const progress=clamp(player.x/current.length,0,1);ctx.fillStyle='#17232e';ctx.fillRect(24,68,240,7);ctx.fillStyle=current.accent;ctx.fillRect(24,68,240*progress,7);if(boss?.alive){ctx.fillStyle='#fff';ctx.font='700 14px monospace';ctx.fillText(current.boss.toUpperCase(),330,31);ctx.fillStyle='#351317';ctx.fillRect(330,42,300,12);ctx.fillStyle='#e85d5d';ctx.fillRect(330,42,300*Math.max(0,boss.hp/boss.maxHp),12)}ctx.fillStyle='#9fd3ff';ctx.font='14px monospace';ctx.fillText('A/D or arrows: move  •  W/UP: jump  •  J/SPACE: fire',24,H-18);if(transition>0){ctx.fillStyle='rgba(0,0,0,.52)';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='900 34px monospace';ctx.fillText(boss&&!boss.alive?'TARGET DESTROYED':`LEVEL ${levelIndex+1}: ${current.name.toUpperCase()}`,W/2,H/2);ctx.font='700 17px monospace';ctx.fillStyle='#9fd3ff';ctx.fillText(boss&&!boss.alive?'Advancing to the next operation...':current.boss.toUpperCase()+' AWAITS',W/2,H/2+34);ctx.textAlign='left'}}
    function loop(now){const dt=Math.min((now-last)/1000,.033);last=now;update(dt);draw();if(started)raf=requestAnimationFrame(loop)}
    raf=requestAnimationFrame(loop);return()=>{cancelAnimationFrame(raf);audio.stop();removeEventListener('keydown',down);removeEventListener('keyup',up);keys.clear();previousControlsRef.current.clear()}
  },[started])
  const press=code=>e=>{e.preventDefault();controlsRef.current.add(code);e.currentTarget?.setPointerCapture?.(e.pointerId)}
  const release=code=>e=>{e.preventDefault();controlsRef.current.delete(code)}
  const bind=code=>({onPointerDown:press(code),onPointerUp:release(code),onPointerCancel:release(code),onPointerLeave:release(code),onContextMenu:e=>e.preventDefault()})
  const begin=()=>{controlsRef.current.clear();previousControlsRef.current.clear();setScore(0);setLives(3);setLevel(1);setStatus('playing');setStarted(true)}
  const title=status==='victory'?'CAMPAIGN COMPLETE':status==='failed'?'MISSION FAILED':'READY?'
  const button=status==='victory'?'PLAY AGAIN':status==='failed'?'RESTART CAMPAIGN':'START CAMPAIGN'
  return <section className="shell"><header><div><span className="eyebrow">ORIGINAL HUMAN SOLDIER RUN-AND-GUN</span><h1>SHADOW STRIKE</h1></div><div className="hud"><b>{score}</b><span>score</span><b>{lives}</b><span>lives</span></div></header><div className="ad-slot" aria-label="advertisement"><span>ADVERTISEMENT</span><small>Responsive banner slot — connect your approved ad network ID here.</small></div><div className="game-frame"><canvas ref={canvasRef} width={W} height={H}/>{!started&&<div className="overlay"><h2>{title}</h2><p>{status==='victory'?`You defeated all six Shadow Strike bosses with a final score of ${score}.`:'Fight through six original operations, defeat every boss, and stop the Warlord.'}</p><button onClick={begin}>{button}</button></div>}</div>{started&&<div className="external-gamepad" aria-label="Game controls"><div className="pad-left"><button className="pad-btn pad-left-btn" aria-label="Move left" {...bind('PadLeft')}>◀</button><button className="pad-btn pad-right-btn" aria-label="Move right" {...bind('PadRight')}>▶</button></div><div className="pad-right"><button className="pad-btn pad-jump-btn" aria-label="Jump" {...bind('PadJump')}>▲</button><button className="pad-btn pad-fire-btn" aria-label="Fire" {...bind('PadFire')}>FIRE</button></div></div>}</section>
}
