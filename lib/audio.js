export function createAudio() {
  let ctx = null
  let master = null
  let musicTimer = null
  let musicStep = 0
  let muted = false

  const ensure = () => {
    if (typeof window === 'undefined') return null
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return null
      ctx = new AudioContext()
      master = ctx.createGain()
      master.gain.value = 0.22
      const compressor = ctx.createDynamicsCompressor()
      compressor.threshold.value = -18
      compressor.knee.value = 14
      compressor.ratio.value = 4
      compressor.attack.value = 0.004
      compressor.release.value = 0.12
      master.connect(compressor).connect(ctx.destination)
    }
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }

  const tone = (freq, duration, type = 'square', volume = 0.08, slide = 0, when = 0) => {
    const c = ensure()
    if (!c || muted) return
    const now = c.currentTime + when
    const osc = c.createOscillator()
    const gain = c.createGain()
    const filter = c.createBiquadFilter()
    osc.type = type
    osc.frequency.setValueAtTime(Math.max(40, freq), now)
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), now + duration)
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(Math.min(9000, Math.max(500, freq * 3)), now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(filter).connect(gain).connect(master)
    osc.start(now)
    osc.stop(now + duration + 0.02)
  }

  const noise = (duration = 0.12, volume = 0.08, cutoff = 2400) => {
    const c = ensure()
    if (!c || muted) return
    const now = c.currentTime
    const buffer = c.createBuffer(1, Math.floor(c.sampleRate * duration), c.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const source = c.createBufferSource()
    const filter = c.createBiquadFilter()
    const gain = c.createGain()
    source.buffer = buffer
    filter.type = 'bandpass'
    filter.frequency.value = cutoff
    filter.Q.value = 0.7
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    source.connect(filter).connect(gain).connect(master)
    source.start(now)
  }

  const startMusic = () => {
    if (musicTimer || muted) return
    ensure()
    const bass = [55, 55, 65.41, 49, 55, 73.42, 65.41, 49]
    const lead = [220, 0, 261.63, 0, 293.66, 261.63, 196, 0]
    musicTimer = setInterval(() => {
      if (!ensure()) return
      const i = musicStep++ % bass.length
      tone(bass[i], 0.18, 'sawtooth', 0.045, 0)
      if (lead[i]) tone(lead[i], 0.11, 'square', 0.018, i % 2 ? -25 : 25, 0.02)
      if (i === 3 || i === 7) tone(bass[i] / 2, 0.16, 'triangle', 0.025, -5)
    }, 220)
  }

  const stopMusic = () => {
    if (musicTimer) clearInterval(musicTimer)
    musicTimer = null
  }

  return {
    start() { ensure(); startMusic() },
    stop() { stopMusic() },
    mute(value = true) { muted = value; if (muted) stopMusic() },
    shot() { tone(1250, 0.055, 'square', 0.075, -700); noise(0.045, 0.035, 4200) },
    enemyShot() { tone(280, 0.11, 'sawtooth', 0.045, -90) },
    hit() { tone(180, 0.075, 'square', 0.06, 90); noise(0.055, 0.03, 1800) },
    enemyDown() { tone(180, 0.12, 'sawtooth', 0.065, -120); tone(90, 0.16, 'triangle', 0.05, -35, 0.04) },
    damage() { noise(0.18, 0.085, 900); tone(95, 0.24, 'sawtooth', 0.075, -35) },
    pickup() { tone(660, 0.09, 'square', 0.05, 120); tone(990, 0.13, 'square', 0.04, 80, 0.08) },
    boss() { tone(72, 0.45, 'sawtooth', 0.11, -18); tone(144, 0.3, 'square', 0.045, -20, 0.06) },
    bossDown() { noise(0.55, 0.11, 500); tone(110, 0.55, 'sawtooth', 0.09, -75); tone(220, 0.7, 'triangle', 0.05, -100, 0.12) },
    level() { [0, 1, 2, 3].forEach(i => tone([262, 330, 392, 523][i], 0.16, 'square', 0.04, 15, i * 0.09)) },
    victory() { [262, 330, 392, 523, 659].forEach((f, i) => tone(f, 0.22, 'triangle', 0.05, 10, i * 0.11)) },
    gameOver() { tone(220, 0.28, 'sawtooth', 0.06, -80); tone(165, 0.4, 'sawtooth', 0.05, -70, 0.22) },
  }
}
