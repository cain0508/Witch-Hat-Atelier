// ═══════════════════════════════════════════════
//  MAGIC CIRCLE — Canvas stage
//  Renders the three-ring circle with slots.
//  User clicks a slot to place the selected glyph.
//  Connector lines draw between center and placed glyphs.
//
//  Phase 5 — Item 2: Cast spell ink draw animation
//    • Circle redraws stroke-by-stroke on cast (~600ms)
//    • Radial pulse expands outward and fades
//    • Triggered via triggerCastAnim prop from parent
// ═══════════════════════════════════════════════

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { GLYPHS } from '@/lib/glyphs'
import { SLOTS } from '@/lib/spellLogic'
import GlyphSlot from './GlyphSlot'

const SIZE = 360
const CX   = 180
const CY   = 180

// ── Animation state ──
const castAnim = { active: false, progress: 0, startTime: 0 }

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3) }
function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2 }

export default function MagicCircle({
  placedGlyphs,
  selectedGlyph,
  onPlaceGlyph,
  neatness,
  triggerCastAnim, // boolean — set true by parent on cast
}) {
  const canvasRef  = useRef(null)
  const rafRef     = useRef(null)
  const [hoveredSlot, setHoveredSlot] = useState(null)

  // ── Trigger cast animation when prop flips true ──
  useEffect(() => {
    if (!triggerCastAnim) return
    castAnim.active    = true
    castAnim.progress  = 0
    castAnim.startTime = performance.now()
    // Kick off loop if not already running
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(renderLoop)
    }
  }, [triggerCastAnim])

  // ── Render loop (runs only during animation or on state change) ──
  const renderLoop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    if (castAnim.active) {
      const elapsed   = performance.now() - castAnim.startTime
      castAnim.progress = Math.min(elapsed / 600, 1) // 600ms total
      if (castAnim.progress >= 1) castAnim.active = false
    }

    draw(ctx, placedGlyphs, selectedGlyph, hoveredSlot, neatness, castAnim)

    if (castAnim.active) {
      rafRef.current = requestAnimationFrame(renderLoop)
    } else {
      rafRef.current = null
    }
  }, [placedGlyphs, selectedGlyph, hoveredSlot, neatness])

  // ── Static redraw when no animation running ──
  useEffect(() => {
    if (rafRef.current) return // animation loop handles it
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    draw(ctx, placedGlyphs, selectedGlyph, hoveredSlot, neatness, castAnim)
  }, [placedGlyphs, selectedGlyph, hoveredSlot, neatness])

  // Cleanup on unmount
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  // ── Mouse handlers (unchanged) ──
  function getHoveredSlot(e) {
    const rect   = canvasRef.current.getBoundingClientRect()
    const scaleX = SIZE / rect.width
    const scaleY = SIZE / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top)  * scaleY
    return SLOTS.find(slot => {
      const dx = mx - slot.x
      const dy = my - slot.y
      return Math.sqrt(dx*dx + dy*dy) < slot.size / 2
    }) ?? null
  }

  function handleMouseMove(e) {
    const slot = getHoveredSlot(e)
    setHoveredSlot(slot?.id ?? null)
  }
  function handleMouseLeave() { setHoveredSlot(null) }
  function handleClick(e) {
    const slot = getHoveredSlot(e)
    if (!slot || placedGlyphs[slot.id] || !selectedGlyph) return
    onPlaceGlyph(slot.id)
  }

  const isHoveringEmpty = hoveredSlot && !placedGlyphs[hoveredSlot]
  const cursor = isHoveringEmpty && selectedGlyph ? 'pointer' : 'default'

  return (
    <div className="relative w-full max-w-[360px] aspect-square rounded-xl overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        style={{ width: '100%', height: '100%', cursor }}
        className="absolute inset-0 z-0 bg-[#0d091a]"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      {SLOTS.map(slot => (
        <GlyphSlot
          key={slot.id}
          slot={slot}
          placedGlyphId={placedGlyphs[slot.id]}
          selectedGlyph={selectedGlyph}
          onPlace={onPlaceGlyph}
        />
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════
//  DRAW FUNCTION
// ══════════════════════════════════════════════

function draw(ctx, placedGlyphs, selectedGlyph, hoveredSlot, neatness, anim) {
  ctx.clearRect(0, 0, SIZE, SIZE)

  const isComplete  = !!placedGlyphs['c0']
  const placedCount = Object.keys(placedGlyphs).length
  const glowAlpha   = neatness ? 0.15 + (neatness.overall / 100) * 0.4 : 0.15
  const castP       = anim?.active ? easeOutCubic(anim.progress) : 1

  drawBackground(ctx)
  drawRings(ctx, isComplete, placedCount, glowAlpha, anim)
  drawConnectors(ctx, placedGlyphs)
  drawCrosshairs(ctx)

  // ── Radial pulse — expands from center after rings fully drawn ──
  if (anim?.active && anim.progress > 0.5) {
    const pulseP     = (anim.progress - 0.5) / 0.5   // 0→1 in second half
    const pulseR     = 30 + pulseP * 160              // expands outward
    const pulseAlpha = (1 - pulseP) * 0.55

    ctx.save()
    ctx.beginPath()
    ctx.arc(CX, CY, pulseR, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(240, 192, 64, ${pulseAlpha})`
    ctx.lineWidth   = 2.5 * (1 - pulseP * 0.7)
    ctx.shadowColor = '#f0c040'
    ctx.shadowBlur  = 10 * (1 - pulseP)
    ctx.stroke()

    // Second, slightly delayed pulse ring
    if (pulseP > 0.2) {
      const p2    = (pulseP - 0.2) / 0.8
      const r2    = 30 + p2 * 130
      const a2    = (1 - p2) * 0.3
      ctx.beginPath()
      ctx.arc(CX, CY, r2, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255, 220, 100, ${a2})`
      ctx.lineWidth   = 1.5
      ctx.stroke()
    }
    ctx.restore()
  }
}

// ── BACKGROUND (unchanged) ───────────────────────────────────
function drawBackground(ctx) {
  const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, 180)
  grad.addColorStop(0,   'rgba(45, 27, 105, 0.25)')
  grad.addColorStop(0.5, 'rgba(18, 12, 35, 0.15)')
  grad.addColorStop(1,   'rgba(12, 9, 23, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, SIZE, SIZE)
}

// ── RINGS — with ink-draw animation ──────────────────────────
function drawRings(ctx, isComplete, placedCount, glowAlpha, anim) {
  const castP = anim?.active ? easeInOutCubic(anim.progress) : 1

  // Outer ring — draws stroke-by-stroke using arc partial angle
  ctx.beginPath()
  if (castP < 1) {
    // Animate: draw arc from -90deg (top) sweeping clockwise
    ctx.arc(CX, CY, 158, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * castP))
  } else {
    ctx.arc(CX, CY, 158, 0, Math.PI * 2)
  }
  ctx.strokeStyle = '#3d1f00'
  ctx.lineWidth   = 2.5
  ctx.setLineDash([6, 3])
  ctx.stroke()
  ctx.setLineDash([])

  // Inner ring — starts drawing at 40% through animation
  if (castP > 0.4) {
    const innerP = Math.min((castP - 0.4) / 0.6, 1)
    const innerEased = easeInOutCubic(innerP)
    ctx.beginPath()
    if (innerEased < 1) {
      ctx.arc(CX, CY, 93, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * innerEased))
    } else {
      ctx.arc(CX, CY, 93, 0, Math.PI * 2)
    }
    ctx.strokeStyle = `rgba(122, 79, 26, ${0.5 * innerEased})`
    ctx.lineWidth   = 1
    ctx.stroke()
  }

  // Center watermark glyph — only when not animating and no center glyph placed
  if (!isComplete && castP >= 1) {
    ctx.fillStyle = 'rgba(160, 120, 64, 0.08)'
    ctx.font = '80px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('◈', CX, CY + 5)
  }
}

// ── CROSSHAIRS (unchanged) ────────────────────────────────────
function drawCrosshairs(ctx) {
  ctx.setLineDash([])
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.04)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(CX, 10); ctx.lineTo(CX, SIZE - 10)
  ctx.moveTo(10, CY); ctx.lineTo(SIZE - 10, CY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(50, 50); ctx.lineTo(SIZE - 50, SIZE - 50)
  ctx.moveTo(SIZE - 50, 50); ctx.lineTo(50, SIZE - 50)
  ctx.stroke()
}

// ── CONNECTORS (unchanged) ────────────────────────────────────
function drawConnectors(ctx, placedGlyphs) {
  if (!placedGlyphs['c0']) return
  const centerSlot = SLOTS.find(s => s.id === 'c0')
  Object.entries(placedGlyphs).forEach(([slotId, glyphId]) => {
    if (slotId === 'c0') return
    const slot  = SLOTS.find(s => s.id === slotId)
    const glyph = GLYPHS.find(g => g.id === glyphId)
    if (!slot || !glyph) return
    ctx.beginPath()
    ctx.moveTo(centerSlot.x, centerSlot.y)
    ctx.lineTo(slot.x, slot.y)
    ctx.strokeStyle = hexToRgba(glyph.color, 0.2)
    ctx.lineWidth = 0.8
    ctx.setLineDash([2, 5])
    ctx.stroke()
    ctx.setLineDash([])
  })
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
