// ═══════════════════════════════════════════════
//  MAGIC CIRCLE — Canvas stage
//  Renders the three-ring circle with slots.
//  User clicks a slot to place the selected glyph.
//  Connector lines draw between center and placed glyphs.
// ═══════════════════════════════════════════════

'use client'

import { useEffect, useRef, useState } from 'react'
import { GLYPHS } from '@/lib/glyphs'
import { SLOTS } from '@/lib/spellLogic'

// Canvas dimensions
const SIZE = 360
const CX   = 180
const CY   = 180

export default function MagicCircle({
  placedGlyphs,    // { slotId: glyphId, ... }
  selectedGlyph,   // currently selected glyph id
  onPlaceGlyph,    // (slotId) => void
  neatness,        // { ring, sigil, balance, overall } or null
}) {
  const canvasRef = useRef(null)
  const [hoveredSlot, setHoveredSlot] = useState(null)

  // Redraw canvas whenever state changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    draw(ctx, placedGlyphs, selectedGlyph, hoveredSlot, neatness)
  }, [placedGlyphs, selectedGlyph, hoveredSlot, neatness])

  // ── MOUSE HANDLERS ─────────────────────────────

  function getHoveredSlot(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = SIZE / rect.width
    const scaleY = SIZE / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top)  * scaleY

    return SLOTS.find(slot => {
      const dx = mx - slot.x
      const dy = my - slot.y
      return Math.sqrt(dx * dx + dy * dy) < slot.size / 2
    }) ?? null
  }

  function handleMouseMove(e) {
    const slot = getHoveredSlot(e)
    setHoveredSlot(slot?.id ?? null)
  }

  function handleMouseLeave() {
    setHoveredSlot(null)
  }

  function handleClick(e) {
    const slot = getHoveredSlot(e)
    if (!slot) return

    // Don't allow placing on already filled slots
    if (placedGlyphs[slot.id]) return

    // Need a glyph selected first
    if (!selectedGlyph) return

    onPlaceGlyph(slot.id)
  }

  // Cursor style
  const isHoveringEmpty = hoveredSlot && !placedGlyphs[hoveredSlot]
  const cursor = isHoveringEmpty && selectedGlyph ? 'pointer' : 'default'

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ cursor, width: '100%', maxWidth: SIZE }}
      className="rounded-xl"
    />
  )
}

// ══════════════════════════════════════════════
//  DRAW FUNCTION — Pure canvas drawing
//  Called every time state changes.
// ══════════════════════════════════════════════

function draw(ctx, placedGlyphs, selectedGlyph, hoveredSlot, neatness) {
  ctx.clearRect(0, 0, SIZE, SIZE)

  const isComplete = !!placedGlyphs['c0']
  const placedCount = Object.keys(placedGlyphs).length

  // Glow intensity based on neatness
  const glowAlpha = neatness
    ? 0.15 + (neatness.overall / 100) * 0.4
    : 0.15

  drawBackground(ctx)
  drawRings(ctx, isComplete, placedCount, glowAlpha)
  drawConnectors(ctx, placedGlyphs)
  drawSlots(ctx, placedGlyphs, selectedGlyph, hoveredSlot)
  drawCrosshairs(ctx)
}

// ── BACKGROUND ───────────────────────────────────
function drawBackground(ctx) {
  // Deep dark center
  const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, 180)
  grad.addColorStop(0,   'rgba(45, 27, 105, 0.25)')
  grad.addColorStop(0.5, 'rgba(18, 12, 35, 0.15)')
  grad.addColorStop(1,   'rgba(12, 9, 23, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, SIZE, SIZE)
}

// ── RINGS ─────────────────────────────────────────
function drawRings(ctx, isComplete, placedCount, glowAlpha) {
  const rings = [
    { r: 158, dashOn: 4,  dashOff: 7, baseAlpha: 0.10 }, // outer
    { r: 93,  dashOn: 3,  dashOff: 6, baseAlpha: 0.13 }, // inner
    { r: 30,  dashOn: 0,  dashOff: 0, baseAlpha: 0.18 }, // center
  ]

  rings.forEach(({ r, dashOn, dashOff, baseAlpha }) => {
    const alpha = isComplete
      ? baseAlpha + glowAlpha * (1 - r / 200)
      : baseAlpha

    ctx.beginPath()
    ctx.arc(CX, CY, r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(201, 168, 76, ${alpha})`
    ctx.lineWidth = isComplete ? 1.2 : 0.8

    if (dashOn > 0) {
      ctx.setLineDash([dashOn, dashOff])
    } else {
      ctx.setLineDash([])
    }

    ctx.stroke()
    ctx.setLineDash([])

    // Glow effect when circle is active
    if (isComplete && r === 30) {
      ctx.beginPath()
      ctx.arc(CX, CY, r, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(201, 168, 76, ${glowAlpha * 0.5})`
      ctx.lineWidth = 4
      ctx.stroke()
    }
  })
}

// ── CROSSHAIRS ────────────────────────────────────
function drawCrosshairs(ctx) {
  ctx.setLineDash([])
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.04)'
  ctx.lineWidth = 1

  // Straight cross
  ctx.beginPath()
  ctx.moveTo(CX, 10); ctx.lineTo(CX, SIZE - 10)
  ctx.moveTo(10, CY); ctx.lineTo(SIZE - 10, CY)
  ctx.stroke()

  // Diagonal cross
  ctx.beginPath()
  ctx.moveTo(50, 50); ctx.lineTo(SIZE - 50, SIZE - 50)
  ctx.moveTo(SIZE - 50, 50); ctx.lineTo(50, SIZE - 50)
  ctx.stroke()
}

// ── CONNECTORS ────────────────────────────────────
// Lines from center glyph to all other placed glyphs
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

// ── SLOTS ─────────────────────────────────────────
function drawSlots(ctx, placedGlyphs, selectedGlyph, hoveredSlot) {
  SLOTS.forEach(slot => {
    const placedGlyphId = placedGlyphs[slot.id]
    const isHovered     = hoveredSlot === slot.id
    const isFilled      = !!placedGlyphId
    const r             = slot.size / 2

    if (isFilled) {
      drawFilledSlot(ctx, slot, placedGlyphId)
    } else {
      drawEmptySlot(ctx, slot, isHovered, !!selectedGlyph)
    }
  })
}

// Empty slot — dashed circle with hover state
function drawEmptySlot(ctx, slot, isHovered, hasSelection) {
  const r = slot.size / 2

  // Slot background
  ctx.beginPath()
  ctx.arc(slot.x, slot.y, r, 0, Math.PI * 2)
  ctx.fillStyle = isHovered && hasSelection
    ? 'rgba(201, 168, 76, 0.08)'
    : 'rgba(12, 9, 23, 0.5)'
  ctx.fill()

  // Slot border
  ctx.beginPath()
  ctx.arc(slot.x, slot.y, r, 0, Math.PI * 2)
  ctx.strokeStyle = isHovered && hasSelection
    ? 'rgba(201, 168, 76, 0.7)'
    : 'rgba(201, 168, 76, 0.2)'
  ctx.lineWidth = isHovered ? 1.2 : 0.8
  ctx.setLineDash([3, 4])
  ctx.stroke()
  ctx.setLineDash([])

  // Hover glow
  if (isHovered && hasSelection) {
    ctx.beginPath()
    ctx.arc(slot.x, slot.y, r + 3, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.15)'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  // Ring indicator dot
  const dotColors = { center: 'rgba(201,168,76,0.25)', inner: 'rgba(201,168,76,0.18)', outer: 'rgba(201,168,76,0.12)' }
  ctx.beginPath()
  ctx.arc(slot.x, slot.y, 3, 0, Math.PI * 2)
  ctx.fillStyle = dotColors[slot.ring]
  ctx.fill()
}

// Filled slot — solid border with glyph color + SVG rendered via Image
function drawFilledSlot(ctx, slot, glyphId) {
  const glyph = GLYPHS.find(g => g.id === glyphId)
  if (!glyph) return
  const r = slot.size / 2

  // Filled background
  ctx.beginPath()
  ctx.arc(slot.x, slot.y, r, 0, Math.PI * 2)
  ctx.fillStyle = hexToRgba(glyph.color, 0.08)
  ctx.fill()

  // Colored border
  ctx.beginPath()
  ctx.arc(slot.x, slot.y, r, 0, Math.PI * 2)
  ctx.strokeStyle = hexToRgba(glyph.color, 0.8)
  ctx.lineWidth = 1.2
  ctx.setLineDash([])
  ctx.stroke()

  // Subtle glow ring
  ctx.beginPath()
  ctx.arc(slot.x, slot.y, r + 3, 0, Math.PI * 2)
  ctx.strokeStyle = hexToRgba(glyph.color, 0.15)
  ctx.lineWidth = 4
  ctx.stroke()

  // Draw glyph SVG as image
  drawGlyphIcon(ctx, slot, glyph)
}

// Render SVG glyph icon onto canvas via Image element
const glyphImageCache = {}

function drawGlyphIcon(ctx, slot, glyph) {
  const size = slot.size * 0.65
  const x    = slot.x - size / 2
  const y    = slot.y - size / 2

  if (glyphImageCache[glyph.id]) {
    ctx.drawImage(glyphImageCache[glyph.id], x, y, size, size)
    return
  }

  // Convert SVG string to Image
  const svgBlob = new Blob([glyph.svg], { type: 'image/svg+xml' })
  const url     = URL.createObjectURL(svgBlob)
  const img     = new Image()

  img.onload = () => {
    glyphImageCache[glyph.id] = img
    ctx.drawImage(img, x, y, size, size)
    URL.revokeObjectURL(url)
  }

  img.src = url
}

// ── UTILITY ───────────────────────────────────────
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
