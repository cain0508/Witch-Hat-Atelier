// ═══════════════════════════════════════════════
//  BLUEPRINT CANVAS — Multi-shape drawing stage
//  Renders 1-3 shapes side by side with connectors.
//  User clicks slots to place glyphs.
// ═══════════════════════════════════════════════

'use client'

import { useEffect, useRef, useState } from 'react'
import { SHAPES, CONNECTORS } from '@/lib/shapes'
import { GLYPHS } from '@/lib/glyphs'

const CANVAS_W = 760
const CANVAS_H = 380
const SHAPE_W  = 220  // width per shape block
const SHAPE_H  = 340
const GAP      = 40   // gap between shapes

// Uniform scale factor and offsets to center 220x220 shape in 220x340 area
const SCALE = 220 / 400
const Y_OFFSET = (SHAPE_H - SHAPE_W) / 2 // 60px

// Offsets for each shape position
const SHAPE_OFFSETS = [
  { x: 20,  y: 20 },  // shape 1
  { x: 270, y: 20 },  // shape 2
  { x: 520, y: 20 },  // shape 3
]

// Helper — generate a point on a circle
function pt(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export default function BlueprintCanvas({
  blueprint,       // { shapes: [{ shapeId, placedGlyphs }], connectors: [] }
  selectedGlyph,
  onPlaceGlyph,    // (shapeIndex, slotId) => void
  onConnectorChange, // (index, type) => void
  neatness,
}) {
  const canvasRef   = useRef(null)
  const [hovered, setHovered] = useState(null) // { shapeIndex, slotId }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    drawBlueprint(ctx, blueprint, selectedGlyph, hovered, neatness)
  }, [blueprint, selectedGlyph, hovered, neatness])

  function getHitSlot(e) {
    if (!canvasRef.current) return null
    const rect   = canvasRef.current.getBoundingClientRect()
    const scaleX = CANVAS_W / rect.width
    const scaleY = CANVAS_H / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top)  * scaleY

    for (let si = 0; si < blueprint.shapes.length; si++) {
      const { shapeId } = blueprint.shapes[si]
      const shape  = SHAPES.find(s => s.id === shapeId)
      const offset = SHAPE_OFFSETS[si]
      if (!shape || !offset) continue

      for (const slot of shape.slots) {
        const sx = slot.x * SCALE + offset.x
        const sy = slot.y * SCALE + offset.y + Y_OFFSET
        const r  = (slot.size / 2) * SCALE
        const dx = mx - sx
        const dy = my - sy
        if (Math.sqrt(dx*dx + dy*dy) < r) {
          return { shapeIndex: si, slotId: slot.id }
        }
      }
    }
    return null
  }

  function handleClick(e) {
    const hit = getHitSlot(e)
    if (!hit) return
    const { shapeIndex, slotId } = hit
    onPlaceGlyph(shapeIndex, slotId)
  }

  function handleMouseMove(e) {
    const hit = getHitSlot(e)
    setHovered(hit)
  }

  function handleMouseLeave() {
    setHovered(null)
  }

  const isHoveringEmpty = hovered &&
    !blueprint.shapes[hovered?.shapeIndex]?.placedGlyphs?.[hovered?.slotId]
  const cursor = isHoveringEmpty && selectedGlyph ? 'pointer' : 'default'

  return (
    <div className="flex flex-col gap-3 w-full items-center">

      {/* Canvas */}
      <div className="border border-[rgba(201,168,76,0.18)] rounded-xl overflow-hidden bg-[#0c0917] p-1.5 shadow-[0_0_25px_rgba(45,27,105,0.3)]">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor, width:'100%', maxWidth: CANVAS_W }}
          className="bg-[#0c0917]"
        />
      </div>

      {/* Connector selector — shown between shapes */}
      {blueprint.shapes.length >= 2 && (
        <div className="flex items-center justify-center gap-6 mt-2 flex-wrap">
          {blueprint.shapes.slice(0, -1).map((_, idx) => (
            <ConnectorSelector
              key={idx}
              index={idx}
              value={blueprint.connectors?.[idx] ?? CONNECTORS.FLOW}
              onChange={(type) => onConnectorChange(idx, type)}
              shape1={blueprint.shapes[idx]?.shapeId}
              shape2={blueprint.shapes[idx+1]?.shapeId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── CONNECTOR SELECTOR ────────────────────────────
function ConnectorSelector({ index, value, onChange, shape1, shape2 }) {
  const s1 = SHAPES.find(s => s.id === shape1)
  const s2 = SHAPES.find(s => s.id === shape2)

  const options = [
    { value: CONNECTORS.FLOW,   label: 'Flow',   desc: 'Primary output feeds secondary →' },
    { value: CONNECTORS.MIRROR, label: 'Mirror', desc: 'Both shapes reinforce ↔' },
    { value: CONNECTORS.GATE,   label: 'Gate',   desc: 'Secondary triggers when primary completes ⊳' },
    { value: CONNECTORS.DRAIN,  label: 'Drain',  desc: 'Secondary draws power from primary ←' },
    { value: CONNECTORS.OPPOSE, label: 'Oppose', desc: 'Tension — unstable but highly volatile ✕' },
  ]

  return (
    <div className="flex flex-col items-center gap-1.5 bg-[#0e0a1a] border border-[rgba(201,168,76,0.12)] px-4 py-2 rounded-xl">
      <p className="font-cinzel text-[8px] tracking-[1.5px] text-[#c9a84c] uppercase mb-1">
        {s1?.name} ── {s2?.name} Connection
      </p>
      <div className="flex gap-1.5 flex-wrap justify-center">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.desc}
            className={`
              font-cinzel text-[8px] tracking-[1px] uppercase px-2.5 py-1 rounded-full border transition-all
              ${value === opt.value
                ? 'border-[#c9a84c] text-[#e8d090] bg-[rgba(201,168,76,0.15)] shadow-[0_0_8px_rgba(201,168,76,0.15)]'
                : 'border-[rgba(201,168,76,0.15)] text-[#6b6080] hover:border-[rgba(201,168,76,0.35)] hover:text-[#c9a84c]'
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════
//  CANVAS DRAWING
// ══════════════════════════════════════════════════

const glyphImageCache = {}

function drawBlueprint(ctx, blueprint, selectedGlyph, hovered, neatness) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

  // Background grid/glow
  const grad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H)
  grad.addColorStop(0, 'rgba(45,27,105,0.06)')
  grad.addColorStop(1, 'rgba(12,9,23,0.02)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  // Draw connector lines between shapes
  drawConnectorLines(ctx, blueprint)

  // Draw each shape
  blueprint.shapes.forEach(({ shapeId, placedGlyphs = {} }, si) => {
    const shape  = SHAPES.find(s => s.id === shapeId)
    const offset = SHAPE_OFFSETS[si]
    if (!shape || !offset) return
    drawShape(ctx, shape, offset, placedGlyphs, selectedGlyph, hovered, si)
  })
}

function drawConnectorLines(ctx, blueprint) {
  if (blueprint.shapes.length < 2) return

  const CONNECTOR_COLORS = {
    flow:   '#4ecdc4',
    mirror: '#c9a84c',
    gate:   '#9b59b6',
    drain:  '#e8593c',
    oppose: '#fd79a8',
  }

  for (let i = 0; i < blueprint.shapes.length - 1; i++) {
    const o1 = SHAPE_OFFSETS[i]
    const o2 = SHAPE_OFFSETS[i + 1]
    if (!o1 || !o2) continue

    const x1 = o1.x + SHAPE_W
    const y1 = o1.y + SHAPE_H / 2
    const x2 = o2.x
    const y2 = o2.y + SHAPE_H / 2

    const connType  = blueprint.connectors?.[i] ?? 'flow'
    const connColor = CONNECTOR_COLORS[connType] ?? '#c9a84c'

    // Draw connector line
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = `${connColor}60`
    ctx.lineWidth   = 1.5
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([])

    // Connector label in center
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2 - 10
    ctx.fillStyle = connColor
    ctx.font = 'bold 8px Helvetica'
    ctx.textAlign = 'center'
    ctx.fillText(connType.toUpperCase(), mx, my)
  }
}

function drawShape(ctx, shape, offset, placedGlyphs, selectedGlyph, hovered, shapeIndex) {
  // Shape label
  ctx.fillStyle = shape.color + 'cc'
  ctx.font      = 'bold 9px Helvetica'
  ctx.textAlign = 'center'
  ctx.fillText(shape.name.toUpperCase(), offset.x + SHAPE_W/2, offset.y + SHAPE_H + 16)

  // Draw shape outline
  drawShapeOutline(ctx, shape.id, offset, shape.color)

  // Draw slots
  shape.slots.forEach(slot => {
    const cx = slot.x * SCALE + offset.x
    const cy = slot.y * SCALE + offset.y + Y_OFFSET
    const r  = (slot.size / 2) * SCALE

    const isHovered  = hovered?.shapeIndex === shapeIndex && hovered?.slotId === slot.id
    const placedId   = placedGlyphs[slot.id]
    const isFilled   = !!placedId

    if (isFilled) {
      drawFilledSlot(ctx, cx, cy, r, placedId)
    } else {
      drawEmptySlot(ctx, cx, cy, r, isHovered, !!selectedGlyph, slot.role)
    }
  })
}

function drawShapeOutline(ctx, shapeId, offset, color) {
  ctx.strokeStyle = color + '2a'
  ctx.lineWidth   = 1.0
  ctx.setLineDash([3, 4])

  const cx = offset.x + SHAPE_W / 2
  const cy = offset.y + SHAPE_H / 2

  ctx.beginPath()

  switch (shapeId) {
    case 'circle':
      ctx.arc(cx, cy, 160 * SCALE, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, 90 * SCALE, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, 30 * SCALE, 0, Math.PI * 2)
      break
    case 'triangle': {
      const t0 = pt(cx, cy, 160 * SCALE, 0)
      const t1 = pt(cx, cy, 160 * SCALE, 120)
      const t2 = pt(cx, cy, 160 * SCALE, 240)
      ctx.moveTo(t0.x, t0.y)
      ctx.lineTo(t1.x, t1.y)
      ctx.lineTo(t2.x, t2.y)
      ctx.closePath()
      break
    }
    case 'pentagon': {
      const angles = [0, 72, 144, 216, 288]
      const pts = angles.map(a => pt(cx, cy, 160 * SCALE, a))
      ctx.moveTo(pts[0].x, pts[0].y)
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
      ctx.closePath()
      break
    }
    case 'hexagon': {
      const angles = [330, 30, 90, 150, 210, 270]
      const pts = angles.map(a => pt(cx, cy, 160 * SCALE, a))
      ctx.moveTo(pts[0].x, pts[0].y)
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
      ctx.closePath()
      break
    }
    case 'square':
      ctx.rect(cx - 145 * SCALE, cy - 145 * SCALE, 290 * SCALE, 290 * SCALE)
      break
    case 'star': {
      const t0_0 = pt(cx, cy, 160 * SCALE, 0)
      const t0_1 = pt(cx, cy, 160 * SCALE, 120)
      const t0_2 = pt(cx, cy, 160 * SCALE, 240)
      ctx.moveTo(t0_0.x, t0_0.y)
      ctx.lineTo(t0_1.x, t0_1.y)
      ctx.lineTo(t0_2.x, t0_2.y)
      ctx.closePath()
      ctx.stroke()
      ctx.beginPath()
      
      const t1_0 = pt(cx, cy, 160 * SCALE, 60)
      const t1_1 = pt(cx, cy, 160 * SCALE, 180)
      const t1_2 = pt(cx, cy, 160 * SCALE, 300)
      ctx.moveTo(t1_0.x, t1_0.y)
      ctx.lineTo(t1_1.x, t1_1.y)
      ctx.lineTo(t1_2.x, t1_2.y)
      ctx.closePath()
      break
    }
    case 'trispell': {
      const c1 = pt(cx, cy, 80 * SCALE, 0)
      const c2 = pt(cx, cy, 80 * SCALE, 120)
      const c3 = pt(cx, cy, 80 * SCALE, 240)
      ctx.arc(c1.x, c1.y, 80 * SCALE, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(c2.x, c2.y, 80 * SCALE, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(c3.x, c3.y, 80 * SCALE, 0, Math.PI * 2)
      break
    }
    case 'spiral': {
      ctx.moveTo(pt(cx, cy, 150 * SCALE, 330).x, pt(cx, cy, 150 * SCALE, 330).y)
      ctx.quadraticCurveTo(
        cx + 80 * SCALE, cy - 120 * SCALE,
        pt(cx, cy, 120 * SCALE, 60).x, pt(cx, cy, 120 * SCALE, 60).y
      )
      ctx.quadraticCurveTo(
        cx + 130 * SCALE, cy + 80 * SCALE,
        pt(cx, cy, 100 * SCALE, 150).x, pt(cx, cy, 100 * SCALE, 150).y
      )
      ctx.quadraticCurveTo(
        cx - 80 * SCALE, cy + 100 * SCALE,
        pt(cx, cy, 75 * SCALE, 240).x, pt(cx, cy, 75 * SCALE, 240).y
      )
      ctx.quadraticCurveTo(
        cx - 60 * SCALE, cy - 60 * SCALE,
        pt(cx, cy, 50 * SCALE, 330).x, pt(cx, cy, 50 * SCALE, 330).y
      )
      ctx.quadraticCurveTo(
        cx + 30 * SCALE, cy - 30 * SCALE,
        cx, cy
      )
      break
    }
    case 'vesica': {
      ctx.arc(cx - 60 * SCALE, cy, 110 * SCALE, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx + 60 * SCALE, cy, 110 * SCALE, 0, Math.PI * 2)
      break
    }
  }

  ctx.stroke()
  ctx.setLineDash([])
}

function drawEmptySlot(ctx, cx, cy, r, isHovered, hasSelection, role) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = isHovered && hasSelection
    ? 'rgba(201,168,76,0.1)'
    : 'rgba(12,9,23,0.7)'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = isHovered && hasSelection
    ? 'rgba(201,168,76,0.7)'
    : 'rgba(201,168,76,0.2)'
  ctx.lineWidth = isHovered ? 1.2 : 0.7
  ctx.setLineDash([2, 3])
  ctx.stroke()
  ctx.setLineDash([])

  // Role dot
  const roleColors = { 
    core:      '#c9a84c', 
    amplifier: '#e8593c', 
    support:   '#4ecdc4', 
    bridge:    '#3b8bd4', 
    anchor:    '#5cb85c', 
    channel:   '#9b59b6' 
  }
  ctx.beginPath()
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2)
  ctx.fillStyle = roleColors[role] ?? 'rgba(201,168,76,0.3)'
  ctx.globalAlpha = 0.45
  ctx.fill()
  ctx.globalAlpha = 1
}

function drawFilledSlot(ctx, cx, cy, r, glyphId) {
  const glyph = GLYPHS.find(g => g.id === glyphId)
  if (!glyph) return

  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = hexToRgba(glyph.color, 0.12)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = hexToRgba(glyph.color, 0.8)
  ctx.lineWidth = 1.2
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, r + 3, 0, Math.PI * 2)
  ctx.strokeStyle = hexToRgba(glyph.color, 0.15)
  ctx.lineWidth = 3
  ctx.stroke()

  drawGlyphIcon(ctx, cx, cy, r * 1.3, glyph)
}

function drawGlyphIcon(ctx, cx, cy, size, glyph) {
  if (glyphImageCache[glyph.id]) {
    ctx.drawImage(glyphImageCache[glyph.id], cx - size/2, cy - size/2, size, size)
    return
  }
  const blob = new Blob([glyph.svg], { type: 'image/svg+xml' })
  const url  = URL.createObjectURL(blob)
  const img  = new Image()
  img.onload = () => {
    glyphImageCache[glyph.id] = img
    ctx.drawImage(img, cx - size/2, cy - size/2, size, size)
    URL.revokeObjectURL(url)
  }
  img.src = url
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${alpha})`
}
