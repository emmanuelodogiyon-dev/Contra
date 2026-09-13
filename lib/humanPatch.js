'use client'

if (!globalThis.__shadowStrikeHumanPatch) {
  globalThis.__shadowStrikeHumanPatch = true

  const proto = CanvasRenderingContext2D.prototype
  const originalFillRect = proto.fillRect
  const originalSave = proto.save
  const originalRestore = proto.restore
  const states = new WeakMap()
  const enemyColors = new Set(['#9b3d3d', '#b36b2f', '#6d2f39'])

  function state(ctx) {
    let value = states.get(ctx)
    if (!value) {
      value = { playerSkip: false, enemySkip: 0, saves: 0, drawing: false }
      states.set(ctx, value)
    }
    return value
  }

  function originalRect(ctx, x, y, w, h) {
    originalFillRect.call(ctx, x, y, w, h)
  }

  function drawHuman(ctx, x, y, w, h, facing, variant = 'player') {
    const scale = Math.min(w / 46, h / 64)
    const enemy = variant === 'enemy'
    const heavy = variant === 'heavy'
    const armor = enemy ? '#4b3d39' : heavy ? '#34443c' : '#405340'
    const armorHi = enemy ? '#76564c' : '#667754'
    const skin = '#c7835c'
    const skinLight = '#e2a174'
    const hair = '#8d472d'
    const beard = '#683527'
    const dark = '#20292e'
    const gun = '#11181d'
    const gunHi = '#59656a'

    originalSave.call(ctx)
    ctx.translate(x + w / 2, y + h)
    ctx.scale(facing * scale, scale)
    ctx.translate(-23, -64)

    ctx.fillStyle = 'rgba(0,0,0,.38)'; originalRect(ctx, -13, 61, 34, 4)
    ctx.fillStyle = dark; originalRect(ctx, -10, 45, 9, 16); originalRect(ctx, 4, 45, 9, 16)
    ctx.fillStyle = '#0e1418'; originalRect(ctx, -13, 59, 13, 4); originalRect(ctx, 3, 59, 14, 4)
    ctx.fillStyle = '#29372f'; originalRect(ctx, -11, 38, 10, 10); originalRect(ctx, 3, 38, 10, 10)

    ctx.fillStyle = armor
    ctx.beginPath(); ctx.moveTo(-14, 24); ctx.lineTo(12, 24); ctx.lineTo(16, 45); ctx.lineTo(-12, 45); ctx.closePath(); ctx.fill()
    ctx.fillStyle = armorHi; originalRect(ctx, -10, 28, 8, 12); originalRect(ctx, 2, 28, 8, 12)
    ctx.fillStyle = '#202b27'; originalRect(ctx, -11, 40, 23, 4)
    ctx.fillStyle = '#8b9a7d'; originalRect(ctx, -8, 30, 5, 2); originalRect(ctx, 3, 30, 5, 2)

    ctx.fillStyle = skin; originalRect(ctx, -5, 20, 10, 7)
    ctx.fillStyle = skinLight; originalRect(ctx, -9, 8, 18, 14)
    ctx.fillStyle = hair
    ctx.beginPath(); ctx.moveTo(-10, 11); ctx.lineTo(-8, 4); ctx.lineTo(-2, 1); ctx.lineTo(7, 4); ctx.lineTo(10, 10); ctx.lineTo(5, 8); ctx.lineTo(-4, 9); ctx.closePath(); ctx.fill()
    ctx.fillStyle = beard
    ctx.beginPath(); ctx.moveTo(-8, 15); ctx.lineTo(-2, 19); ctx.lineTo(6, 16); ctx.lineTo(5, 22); ctx.lineTo(0, 25); ctx.lineTo(-7, 21); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#20282d'; originalRect(ctx, -6, 12, 3, 2); originalRect(ctx, 3, 12, 3, 2)
    ctx.fillStyle = '#f0c19b'; originalRect(ctx, 6, 15, 3, 2)

    ctx.fillStyle = armorHi; originalRect(ctx, -16, 26, 7, 10); originalRect(ctx, 10, 26, 7, 10)
    ctx.fillStyle = armor; originalRect(ctx, -17, 33, 7, 13); originalRect(ctx, 11, 33, 7, 13)
    ctx.fillStyle = skin; originalRect(ctx, 13, 44, 7, 5)

    ctx.fillStyle = gun; originalRect(ctx, 7, 33, 27, 5); originalRect(ctx, 25, 31, 12, 3); originalRect(ctx, 18, 38, 5, 11)
    ctx.fillStyle = gunHi; originalRect(ctx, 12, 34, 15, 2)
    ctx.fillStyle = '#0a0f12'; originalRect(ctx, 29, 30, 10, 3); originalRect(ctx, 20, 42, 3, 8)
    ctx.fillStyle = '#5b6c72'; originalRect(ctx, 9, 36, 5, 2)

    originalRestore.call(ctx)
  }

  proto.save = function savePatched() {
    const s = state(this)
    s.saves += 1
    return originalSave.call(this)
  }

  proto.restore = function restorePatched() {
    const s = state(this)
    if (s.playerSkip) s.playerSkip = false
    s.saves = Math.max(0, s.saves - 1)
    return originalRestore.call(this)
  }

  proto.fillRect = function fillRectPatched(x, y, w, h) {
    const s = state(this)
    if (s.drawing) return originalFillRect.call(this, x, y, w, h)

    if (s.playerSkip) return
    if (s.enemySkip > 0) {
      s.enemySkip -= 1
      return
    }

    const style = String(this.fillStyle || '').toLowerCase()

    if (style === '#17222b' && x === -12 && y === 1 && w === 24 && h === 12 && s.saves > 0) {
      s.playerSkip = true
      s.drawing = true
      drawHuman(this, -17, 0, 34, 58, 1, 'player')
      s.drawing = false
      return
    }

    if (enemyColors.has(style) && w >= 30 && h >= 40 && w <= 60 && h <= 80) {
      const variant = style === '#6d2f39' ? 'heavy' : 'enemy'
      s.enemySkip = 4
      s.drawing = true
      drawHuman(this, x, y, w, h, -1, variant)
      s.drawing = false
      return
    }

    return originalFillRect.call(this, x, y, w, h)
  }
}
