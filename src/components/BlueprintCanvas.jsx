// ═══════════════════════════════════════════════
//  BLUEPRINT CANVAS — Multi-shape drawing stage
//  Renders 1-3 shapes side by side with connectors.
//  User clicks slots to place glyphs.
//
//  Phase 5 additions:
//    • Item 5 — Connector line draw animation
//    • Item 6 — Shape add entrance animation
//    • Item 8 — Cast Ritual pulse animation
// ═══════════════════════════════════════════════

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { SHAPES, CONNECTORS } from '@/lib/shapes'
import { GLYPHS } from '@/lib/glyphs'
import WaxSeal from './WaxSeal'

const CANVAS_W = 760
const CANVAS_H = 380
const SHAPE_W  = 220
const SHAPE_H  = 340
const GAP      = 40

const SCALE    = 220 / 400
const Y_OFFSET = (SHAPE_H - SHAPE_W) / 2

const SHAPE_OFFSETS = [
  { x: 20,  y: 20 },
  { x: 270, y: 20 },
  { x: 520, y: 20 },
]

function pt(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

// ── Animation state (module-level, no re-render needed) ──

// shapeEnter: { [shapeIndex]: { progress: 0→1, startTime } }
// connectorDraw: { [connIndex]: { progress: 0→1, startTime } }
// castPulse: { active: bool, shapes: [{cx,cy,r}], progress: 0→1, startTime }

const animState = {
  shapeEnter: {},
  connectorDraw: {},
  castPulse: null,
}

export default function BlueprintCanvas({
  blueprint,
  selectedGlyph,
  onPlaceGlyph,
  onConnectorChange,
  neatness,
  onCastAnimComplete,  // optional callback — called when cast pulse finishes
  triggerCastAnim,     // boolean — set true by parent to fire cast pulse
}) {
  const canvasRef  = useRef(null)
  const rafRef     = useRef(null)
  const [hovered, setHovered] = useState(null)

  // Track previous shape/connector counts to detect additions
  const prevShapeCount     = useRef(0)
  const prevConnectorCount = useRef(0)

  // ── Detect new shape added → start enter animation ──
  useEffect(() => {
    const curr = blueprint.shapes.length
    const prev = prevShapeCount.current
    if (curr > prev) {
      const newIndex = curr - 1
      animState.shapeEnter[newIndex] = { progress: 0, startTime: performance.now() }
    }
    // Clean up removed shapes
    if (curr < prev) {
      Object.keys(animState.shapeEnter).forEach(k => {
        if (parseInt(k) >= curr) delete animState.shapeEnter[k]
      })
      Object.keys(animState.connectorDraw).forEach(k => {
        if (parseInt(k) >= curr - 1) delete animState.connectorDraw[k]
      })
    }
    prevShapeCount.current = curr
  }, [blueprint.shapes.length])

  // ── Detect new connector added → start draw animation ──
  useEffect(() => {
    const curr = (blueprint.connectors ?? []).length
    const prev = prevConnectorCount.current
    if (curr > prev) {
      const newIndex = curr - 1
      animState.connectorDraw[newIndex] = { progress: 0, startTime: performance.now() }
    }
    prevConnectorCount.current = curr
  }, [blueprint.connectors?.length])

  // ── Cast pulse triggered from parent ──
  useEffect(() => {
    if (!triggerCastAnim) return
    // Build list of shape centers for the pulse rings
    const shapeCenters = blueprint.shapes.map((_, si) => {
      const offset = SHAPE_OFFSETS[si]
      return { cx: offset.x + SHAPE_W / 2, cy: offset.y + SHAPE_H / 2, r: 160 * SCALE }
    })
    animState.castPulse = {
      active: true,
      shapes: shapeCenters,
      startTime: performance.now(),
    }
  }, [triggerCastAnim])

  // ── Main render loop ──
  const renderLoop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const now = performance.now()
    let needsNextFrame = false

    // Advance shape enter animations
    Object.entries(animState.shapeEnter).forEach(([k, anim]) => {
      const elapsed = now - anim.startTime
      anim.progress = Math.min(elapsed / 300, 1) // 300ms
      if (anim.progress < 1) needsNextFrame = true
    })

    // Advance connector draw animations
    Object.entries(animState.connectorDraw).forEach(([k, anim]) => {
      const elapsed = now - anim.startTime
      anim.progress = Math.min(elapsed / 400, 1) // 400ms
      if (anim.progress < 1) needsNextFrame = true
    })

    // Advance cast pulse
    if (animState.castPulse?.active) {
      const elapsed = now - animState.castPulse.startTime
      animState.castPulse.progress = Math.min(elapsed / 900, 1) // 900ms total
      if (animState.castPulse.progress < 1) {
        needsNextFrame = true
      } else {
        animState.castPulse.active = false
        onCastAnimComplete?.()
      }
    }

    drawBlueprint(ctx, blueprint, selectedGlyph, hovered, neatness, animState)

    if (needsNextFrame) {
      rafRef.current = requestAnimationFrame(renderLoop)
    } else {
      rafRef.current = null
    }
  }, [blueprint, selectedGlyph, hovered, neatness, onCastAnimComplete])

  // Start/restart loop whenever deps change
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(renderLoop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [renderLoop])

  // ── Hit testing (unchanged) ──
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
    onPlaceGlyph(hit.shapeIndex, hit.slotId)
  }

  function handleMouseMove(e) {
    const hit = getHitSlot(e)
    setHovered(hit)
  }

  function handleMouseLeave() { setHovered(null) }

  const isHoveringEmpty = hovered &&
    !blueprint.shapes[hovered?.shapeIndex]?.placedGlyphs?.[hovered?.slotId]
  const cursor = isHoveringEmpty && selectedGlyph ? 'pointer' : 'default'

  return (
    <div className="flex flex-col gap-3 w-full items-center">
      <div className="border border-[#a07840] rounded-[4px] overflow-hidden bg-[#d4b483] p-1.5 shadow-[inset_0_0_20px_rgba(180,140,60,0.2)]">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor, width: '100%', maxWidth: CANVAS_W }}
          className="bg-[#d4b483]"
        />
      </div>

      {blueprint.shapes.length >= 2 && (
        <div className="flex items-center justify-center gap-6 mt-2 flex-wrap">
          {blueprint.shapes.slice(0, -1).map((_, idx) => (
            <ConnectorSelector
              key={idx}
              index={idx}
              value={blueprint.connectors?.[idx] ?? CONNECTORS.FLOW}
              onChange={(type) => onConnectorChange(idx, type)}
              shape1={blueprint.shapes[idx]?.shapeId}
              shape2={blueprint.shapes[idx + 1]?.shapeId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── CONNECTOR SELECTOR (unchanged) ───────────────────────────────
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

  const CONNECTOR_SVGS = {
    flow: s1?.svgPath
      ? `<svg viewBox="0 0 400 400" stroke="currentColor" fill="none" stroke-width="12">${s1.svgPath.replace(/stroke-width="1.5"/g, 'stroke-width="12"')}</svg>`
      : `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="5"/></svg>`,
    mirror: `<svg viewBox="0 0 100 100" stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M40 20 V80 M60 20 V80 M25 50 L40 35 M25 50 L40 65 M75 50 L60 35 M75 50 L60 65" /></svg>`,
    gate:   `<svg viewBox="0 0 100 100" stroke="currentColor" stroke-width="6" fill="none"><path d="M20 80 V50 A30 30 0 0 1 80 50 V80 M20 50 H30 M70 50 H80"/></svg>`,
    drain:  `<svg viewBox="0 0 100 100" stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M20 50 H80 M50 20 V50 M50 20 L30 40 M50 20 L70 40 M50 80 V50" /></svg>`,
    oppose: `<svg viewBox="0 0 100 100" stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M30 30 L70 70 M30 70 L70 30 M30 50 L50 30" /><path d="M70 50 L50 70" /></svg>`,
  }

  return (
    <div className="flex flex-col items-center px-4 pt-1 pb-2">
      <p className="font-cinzel text-[11px] tracking-[1.5px] text-[#3b1f0a] font-bold uppercase mb-2">
        {s1?.name} — {s2?.name} Connection
      </p>
      <div
        className="flex gap-4 flex-wrap justify-center items-center px-4 py-3 rounded-[6px]"
        style={{
          background: 'linear-gradient(180deg, #d4a017 0%, #a07840 10%, #7a4f1a 100%)',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5), inset 0 0 0 2px #fce38a, inset 0 0 0 4px #b8860b',
        }}
      >
        <div className="flex gap-2">
          {options.map(opt => {
            const isActive = value === opt.value
            return (
              <div
                key={opt.value}
                className="flex flex-col items-center gap-1 cursor-pointer group"
                onClick={() => onChange(opt.value)}
                title={opt.desc}
              >
                <WaxSeal
                  color={isActive ? '#c9a55a' : '#4a2a10'}
                  iconSvg={CONNECTOR_SVGS[opt.value]}
                  size={52}
                  isDark={!isActive}
                  glowColor={isActive ? '#f0c040' : null}
                  className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
                />
                <span className={`font-cinzel text-[10px] tracking-[1px] uppercase mt-1 ${isActive ? 'text-[#3b1f0a] font-bold' : 'text-[#2b1500]'}`}>
                  {opt.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════
//  CANVAS DRAWING
// ══════════════════════════════════════════════════

const glyphImageCache = {}

// Easing helpers
function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3) }
function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2 }

function drawBlueprint(ctx, blueprint, selectedGlyph, hovered, neatness, anim) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

  ctx.fillStyle = '#d4b483'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  // Runic watermark
  ctx.fillStyle = 'rgba(160, 120, 64, 0.06)'
  ctx.font = '24px serif'
  for (let y = 20; y < CANVAS_H; y += 40) {
    ctx.fillText('ᚠᚢᚦᚨᚱᚲ'.repeat(30), 0, y)
  }

  drawConnectorLines(ctx, blueprint, anim)

  blueprint.shapes.forEach(({ shapeId, placedGlyphs = {} }, si) => {
    const shape  = SHAPES.find(s => s.id === shapeId)
    const offset = SHAPE_OFFSETS[si]
    if (!shape || !offset) return

    const enterAnim = anim.shapeEnter[si]
    const scale     = enterAnim ? easeOutBack(enterAnim.progress) : 1
    const alpha     = enterAnim ? easeOutCubic(enterAnim.progress) : 1

    // ── Item 6: shape entrance — scale + ink-splash ring ──
    if (enterAnim && enterAnim.progress < 1) {
      const cx = offset.x + SHAPE_W / 2
      const cy = offset.y + SHAPE_H / 2
      const splashR = 120 * SCALE * enterAnim.progress
      const splashAlpha = 1 - enterAnim.progress

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, splashR, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(201, 134, 11, ${splashAlpha * 0.6})`
      ctx.lineWidth = 2 * (1 - enterAnim.progress)
      ctx.stroke()
      ctx.restore()
    }

    // Apply scale transform centered on shape
    const cx = offset.x + SHAPE_W / 2
    const cy = offset.y + SHAPE_H / 2
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(cx, cy)
    ctx.scale(scale, scale)
    ctx.translate(-cx, -cy)

    drawShape(ctx, shape, offset, placedGlyphs, selectedGlyph, hovered, si)

    ctx.restore()
  })

  // ── Item 8: cast pulse — staggered rings per shape, then connector flash ──
  if (anim.castPulse?.active) {
    const p = anim.castPulse.progress // 0 → 1 over 900ms

    anim.castPulse.shapes.forEach(({ cx, cy, r }, si) => {
      // Each shape pulses with 120ms stagger
      const staggerOffset = si * (120 / 900)
      const localP = Math.max(0, Math.min((p - staggerOffset) / 0.6, 1))
      if (localP <= 0) return

      const ringR   = r * (0.8 + localP * 0.7)
      const ringAlpha = (1 - localP) * 0.85

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(240, 192, 64, ${ringAlpha})`
      ctx.lineWidth   = 3 * (1 - localP * 0.5)
      ctx.shadowColor = '#f0c040'
      ctx.shadowBlur  = 12 * (1 - localP)
      ctx.stroke()
      ctx.restore()
    })

    // Connector flash: all lines turn bright gold at p > 0.6
    if (p > 0.6 && blueprint.shapes.length >= 2) {
      const flashP = (p - 0.6) / 0.4
      const flashAlpha = Math.sin(flashP * Math.PI) // peaks at 0.5, back to 0 at 1
      for (let i = 0; i < blueprint.shapes.length - 1; i++) {
        const o1 = SHAPE_OFFSETS[i]
        const o2 = SHAPE_OFFSETS[i + 1]
        if (!o1 || !o2) continue
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(o1.x + SHAPE_W, o1.y + SHAPE_H / 2)
        ctx.lineTo(o2.x, o2.y + SHAPE_H / 2)
        ctx.strokeStyle = `rgba(240, 220, 80, ${flashAlpha})`
        ctx.lineWidth   = 4
        ctx.shadowColor = '#f0c040'
        ctx.shadowBlur  = 16
        ctx.stroke()
        ctx.restore()
      }
    }
  }
}

function drawConnectorLines(ctx, blueprint, anim) {
  if (blueprint.shapes.length < 2) return

  for (let i = 0; i < blueprint.shapes.length - 1; i++) {
    const o1 = SHAPE_OFFSETS[i]
    const o2 = SHAPE_OFFSETS[i + 1]
    if (!o1 || !o2) continue

    const x1 = o1.x + SHAPE_W
    const y1 = o1.y + SHAPE_H / 2
    const x2 = o2.x
    const y2 = o2.y + SHAPE_H / 2

    const connType  = blueprint.connectors?.[i] ?? 'flow'
    const connColor = '#c9860b'

    // ── Item 5: connector line draw animation ──
    const drawAnim = anim?.connectorDraw[i]
    const drawP    = drawAnim ? easeOutCubic(drawAnim.progress) : 1

    // Interpolate endpoint based on progress
    const ex = x1 + (x2 - x1) * drawP
    const ey = y1 + (y2 - y1) * drawP

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(ex, ey)
    ctx.strokeStyle = connColor
    ctx.lineWidth   = 2
    ctx.setLineDash([8, 4])
    ctx.globalAlpha = drawP < 0.1 ? drawP * 10 : 1
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()

    // Arrow tip — only when fully drawn
    if (drawP > 0.95) {
      const arrowAlpha = (drawP - 0.95) / 0.05
      const dx    = x2 - x1
      const dy    = y2 - y1
      const angle = Math.atan2(dy, dx)
      ctx.save()
      ctx.globalAlpha = arrowAlpha
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - 10 * Math.cos(angle - Math.PI / 6), y2 - 10 * Math.sin(angle - Math.PI / 6))
      ctx.lineTo(x2 - 10 * Math.cos(angle + Math.PI / 6), y2 - 10 * Math.sin(angle + Math.PI / 6))
      ctx.closePath()
      ctx.fillStyle = connColor
      ctx.fill()
      ctx.restore()
    }

    // Label pill — only when line is fully drawn
    if (drawP > 0.9) {
      const labelAlpha = (drawP - 0.9) / 0.1
      const mx = (x1 + x2) / 2
      const my = (y1 + y2) / 2
      ctx.save()
      ctx.globalAlpha = labelAlpha
      ctx.font = 'bold 9px Helvetica'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const textWidth = ctx.measureText(connType.toUpperCase()).width
      ctx.fillStyle = 'rgba(232,213,163,0.95)'
      ctx.beginPath()
      ctx.roundRect(mx - textWidth / 2 - 6, my - 8, textWidth + 12, 16, 2)
      ctx.fill()
      ctx.strokeStyle = '#a07840'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillStyle = '#2b1500'
      ctx.fillText(connType.toUpperCase(), mx, my + 1)
      ctx.restore()
    }
  }
}

function drawShape(ctx, shape, offset, placedGlyphs, selectedGlyph, hovered, shapeIndex) {
  ctx.font = 'bold 11px Helvetica'
  ctx.letterSpacing = '0.12em'
  ctx.textAlign = 'center'

  const textStr = shape.name.toUpperCase()
  const textW   = ctx.measureText(textStr).width
  const lx = offset.x + SHAPE_W / 2
  const ly = offset.y + SHAPE_H + 16

  ctx.fillStyle = 'rgba(232,213,163,0.7)'
  ctx.fillRect(lx - textW / 2 - 6, ly - 8, textW + 12, 16)
  ctx.fillStyle = '#3d1f00'
  ctx.fillText(textStr, lx, ly + 3)
  ctx.letterSpacing = '0px'

  drawShapeOutline(ctx, shape.id, offset, '#7a4f1a')

  shape.slots.forEach(slot => {
    const cx = slot.x * SCALE + offset.x
    const cy = slot.y * SCALE + offset.y + Y_OFFSET
    const r  = (slot.size / 2) * SCALE

    const isHovered = hovered?.shapeIndex === shapeIndex && hovered?.slotId === slot.id
    const placedId  = placedGlyphs[slot.id]
    const isFilled  = !!placedId

    if (isFilled) {
      drawFilledSlot(ctx, cx, cy, r, placedId, slot.role)
    } else {
      drawEmptySlot(ctx, cx, cy, r, isHovered, !!selectedGlyph, slot.role)
    }
  })
}

function drawShapeOutline(ctx, shapeId, offset, color) {
  ctx.strokeStyle = '#3d1f00'
  ctx.lineWidth   = 2
  ctx.setLineDash([7, 3])

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
      const pts = [0, 120, 240].map(a => pt(cx, cy, 160 * SCALE, a))
      ctx.moveTo(pts[0].x, pts[0].y)
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
      ctx.closePath()
      break
    }
    case 'pentagon': {
      const pts = [0, 72, 144, 216, 288].map(a => pt(cx, cy, 160 * SCALE, a))
      ctx.moveTo(pts[0].x, pts[0].y)
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
      ctx.closePath()
      break
    }
    case 'hexagon': {
      const pts = [330, 30, 90, 150, 210, 270].map(a => pt(cx, cy, 160 * SCALE, a))
      ctx.moveTo(pts[0].x, pts[0].y)
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
      ctx.closePath()
      break
    }
    case 'square':
      ctx.rect(cx - 145 * SCALE, cy - 145 * SCALE, 290 * SCALE, 290 * SCALE)
      break
    case 'star': {
      const t0 = [0, 120, 240].map(a => pt(cx, cy, 160 * SCALE, a))
      ctx.moveTo(t0[0].x, t0[0].y)
      t0.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
      ctx.closePath()
      ctx.stroke()
      ctx.beginPath()
      const t1 = [60, 180, 300].map(a => pt(cx, cy, 160 * SCALE, a))
      ctx.moveTo(t1[0].x, t1[0].y)
      t1.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
      ctx.closePath()
      break
    }
    case 'trispell': {
      const centers = [0, 120, 240].map(a => pt(cx, cy, 80 * SCALE, a))
      centers.forEach((c, i) => {
        if (i > 0) { ctx.stroke(); ctx.beginPath() }
        ctx.arc(c.x, c.y, 80 * SCALE, 0, Math.PI * 2)
      })
      break
    }
    case 'spiral': {
      ctx.moveTo(pt(cx, cy, 150 * SCALE, 330).x, pt(cx, cy, 150 * SCALE, 330).y)
      ctx.quadraticCurveTo(cx + 80 * SCALE, cy - 120 * SCALE, pt(cx, cy, 120 * SCALE, 60).x, pt(cx, cy, 120 * SCALE, 60).y)
      ctx.quadraticCurveTo(cx + 130 * SCALE, cy + 80 * SCALE, pt(cx, cy, 100 * SCALE, 150).x, pt(cx, cy, 100 * SCALE, 150).y)
      ctx.quadraticCurveTo(cx - 80 * SCALE, cy + 100 * SCALE, pt(cx, cy, 75 * SCALE, 240).x, pt(cx, cy, 75 * SCALE, 240).y)
      ctx.quadraticCurveTo(cx - 60 * SCALE, cy - 60 * SCALE, pt(cx, cy, 50 * SCALE, 330).x, pt(cx, cy, 50 * SCALE, 330).y)
      ctx.quadraticCurveTo(cx + 30 * SCALE, cy - 30 * SCALE, cx, cy)
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
  const roleColors = {
    core: '#f0c040', amplifier: '#e05050', support: '#40c8a0',
    bridge: '#4080e0', anchor: '#50c050', channel: '#a050e0',
  }
  const color = roleColors[role] ?? '#f0c040'

  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.shadowColor = color
  ctx.shadowBlur  = 6
  ctx.beginPath()
  ctx.arc(cx, cy, 4.5, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.shadowColor = 'transparent'
}

function drawFilledSlot(ctx, cx, cy, r, glyphId, role) {
  const glyph = GLYPHS.find(g => g.id === glyphId)
  if (!glyph) return

  const roleColors = {
    core: '#f0c040', amplifier: '#e05050', support: '#40c8a0',
    bridge: '#4080e0', anchor: '#50c050', channel: '#a050e0',
  }
  const color = roleColors[role] ?? '#f0c040'

  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  drawGlyphIcon(ctx, cx, cy, r * 1.6, glyph, '#f5e6c8')
}

function drawGlyphIcon(ctx, cx, cy, size, glyph, colorOverride) {
  const cacheKey = colorOverride ? `${glyph.id}-${colorOverride}` : glyph.id
  if (glyphImageCache[cacheKey]) {
    ctx.drawImage(glyphImageCache[cacheKey], cx - size / 2, cy - size / 2, size, size)
    return
  }

  let svgStr = glyph.svg
  if (colorOverride) svgStr = svgStr.replace(/currentColor/g, colorOverride)

  const blob = new Blob([svgStr], { type: 'image/svg+xml' })
  const url  = URL.createObjectURL(blob)
  const img  = new Image()
  img.onload = () => {
    glyphImageCache[cacheKey] = img
    ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size)
    URL.revokeObjectURL(url)
  }
  img.src = url
}
