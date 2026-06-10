// ═══════════════════════════════════════════════
//  SPELL LOGIC — Neatness scoring + duration
//  This file takes placed glyphs and computes:
//    1. Ring alignment score
//    2. Sigil precision score
//    3. Balance score (conflicts, harmony)
//    4. Overall neatness + spell duration
// ═══════════════════════════════════════════════

import { GLYPHS, GLYPH_TYPES, hasConflicts, areConflicting } from './glyphs.js'

// ── SLOT DEFINITIONS ────────────────────────────
// The magic circle has 13 slots total:
//   1 center, 4 inner ring, 8 outer ring
// Each slot knows its ring zone and position.

const CX = 180  // circle center x (matches MagicCircle canvas)
const CY = 180  // circle center y

function polarToSlot(id, ring, angleDeg, radius, size) {
  const rad = (angleDeg - 90) * Math.PI / 180
  return {
    id,
    ring,
    x: CX + radius * Math.cos(rad),
    y: CY + radius * Math.sin(rad),
    size,
  }
}

export const SLOTS = [
  // Center slot — only primary glyphs allowed here
  { id: 'c0', ring: 'center', x: CX, y: CY, size: 50 },

  // Inner ring — 4 slots, evenly spaced at 90° each
  polarToSlot('i0', 'inner',   0, 93, 40),
  polarToSlot('i1', 'inner',  90, 93, 40),
  polarToSlot('i2', 'inner', 180, 93, 40),
  polarToSlot('i3', 'inner', 270, 93, 40),

  // Outer ring — 8 slots, evenly spaced at 45° each
  polarToSlot('o0', 'outer',   0, 158, 34),
  polarToSlot('o1', 'outer',  45, 158, 34),
  polarToSlot('o2', 'outer',  90, 158, 34),
  polarToSlot('o3', 'outer', 135, 158, 34),
  polarToSlot('o4', 'outer', 180, 158, 34),
  polarToSlot('o5', 'outer', 225, 158, 34),
  polarToSlot('o6', 'outer', 270, 158, 34),
  polarToSlot('o7', 'outer', 315, 158, 34),
]

// Helper — get a slot by id
export function getSlot(slotId) {
  return SLOTS.find(s => s.id === slotId) ?? null
}

// Helper — get a glyph object by id
function getGlyph(glyphId) {
  return GLYPHS.find(g => g.id === glyphId) ?? null
}

// ── SCORE 1: RING ALIGNMENT ──────────────────────
// How evenly are glyphs distributed across each ring?
// A perfectly symmetric circle scores higher.
// Placing 1 glyph on inner ring = unbalanced = lower score.
// Placing 4 glyphs symmetrically on inner = perfect.

function ringAlignmentScore(placedGlyphs) {
  const innerFilled = ['i0','i1','i2','i3'].filter(id => placedGlyphs[id]).length
  const outerFilled = ['o0','o1','o2','o3','o4','o5','o6','o7'].filter(id => placedGlyphs[id]).length

  // If no inner or outer glyphs placed, ring is balanced by absence
  if (innerFilled === 0 && outerFilled === 0) return 100

  let score = 100

  // Inner ring: 4 = perfect, 2 = okay, 1 or 3 = unbalanced
  if (innerFilled === 4) score -= 0          // perfect symmetry
  else if (innerFilled === 2) score -= 10    // half filled — acceptable
  else if (innerFilled === 1) score -= 25    // single glyph — lopsided
  else if (innerFilled === 3) score -= 15    // three — almost balanced

  // Outer ring: 8 = perfect, 4 = good, odd numbers = messy
  if (outerFilled === 8) score -= 0
  else if (outerFilled === 4) score -= 5
  else if (outerFilled % 2 !== 0) score -= 20  // odd count = asymmetric

  return Math.max(30, Math.min(100, score))
}

// ── SCORE 2: SIGIL PRECISION ─────────────────────
// In the click-to-place MVP, precision is simulated
// using a deterministic function per glyph+slot combo.
// When freehand drawing is added, this gets replaced
// with real stroke deviation data from the canvas.

function sigilPrecisionScore(placedGlyphs) {
  const entries = Object.entries(placedGlyphs)
  if (entries.length === 0) return 0

  const scores = entries.map(([slotId, glyphId]) => {
    // Deterministic "quality" — varies by slot+glyph combo
    // Replace this with real stroke data in Phase 2
    const seed = (
      slotId.charCodeAt(0) * 7 +
      slotId.charCodeAt(1) * 13 +
      glyphId.charCodeAt(0) * 31
    ) % 100

    const slot = getSlot(slotId)
    const glyph = getGlyph(glyphId)

    let quality = seed

    // Center glyphs are drawn more carefully (anchored, deliberate)
    if (slot?.ring === 'center') quality = Math.min(100, quality + 15)

    // Primary glyphs in center = most practiced combination
    if (glyph?.type === GLYPH_TYPES.PRIMARY && slot?.ring === 'center') {
      quality = Math.min(100, quality + 10)
    }

    return Math.max(25, Math.min(100, quality))
  })

  // Average precision across all placed glyphs
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

// ── SCORE 3: BALANCE ─────────────────────────────
// Do the glyphs work together or fight each other?
// Conflicting elements (fire+water) destabilise the circle.
// Multiple primaries in the inner ring = chaotic.

function balanceScore(placedGlyphs) {
  const glyphIds = Object.values(placedGlyphs)
  if (glyphIds.length < 2) return 100

  let score = 100

  // Check every pair for elemental conflicts
  for (let i = 0; i < glyphIds.length; i++) {
    for (let j = i + 1; j < glyphIds.length; j++) {
      if (areConflicting(glyphIds[i], glyphIds[j])) {
        score -= 35  // major penalty — opposing elements
      }
    }
  }

  // Multiple primary glyphs in the inner ring = unstable
  const innerPrimaries = ['i0','i1','i2','i3'].filter(id => {
    const glyph = getGlyph(placedGlyphs[id])
    return glyph?.type === GLYPH_TYPES.PRIMARY
  })
  if (innerPrimaries.length >= 2) score -= 25

  // Bonus: modifier glyphs complement the center element
  const centerGlyph = getGlyph(placedGlyphs['c0'])
  const hasTimeMod = glyphIds.includes('duration') || glyphIds.includes('time')
  if (centerGlyph?.element === 'time' && hasTimeMod) score += 10

  return Math.max(15, Math.min(100, score))
}

// ── OVERALL NEATNESS ─────────────────────────────
// Combines all three sub-scores into one number.
// Weights: sigil precision matters most (it's the skill).

export function computeNeatness(placedGlyphs) {
  // Need at least the center glyph to compute anything
  if (!placedGlyphs['c0']) return null

  const ring    = ringAlignmentScore(placedGlyphs)
  const sigil   = sigilPrecisionScore(placedGlyphs)
  const balance = balanceScore(placedGlyphs)

  // Weighted average — precision is the most important
  const overall = Math.round(
    ring    * 0.30 +
    sigil   * 0.45 +
    balance * 0.25
  )

  return { ring, sigil, balance, overall }
}

// ── DURATION MAPPING ─────────────────────────────
// Neatness score maps to spell duration (pip count).
// This feeds the duration bar in the UI AND the Claude prompt.
//
//   90–100  → 8 pips — Enduring   (neater = lasting spell)
//   70–89   → 6 pips — Sustained
//   50–69   → 4 pips — Brief
//   30–49   → 2 pips — Fleeting
//   0–29    → 1 pip  — Barely fires

export function neatnessToDuration(overallScore) {
  if (overallScore >= 90) return { pips: 8, label: 'Enduring',     color: '#4ecdc4' }
  if (overallScore >= 70) return { pips: 6, label: 'Sustained',    color: '#5cb85c' }
  if (overallScore >= 50) return { pips: 4, label: 'Brief',        color: '#c9a84c' }
  if (overallScore >= 30) return { pips: 2, label: 'Fleeting',     color: '#e8593c' }
  return                         { pips: 1, label: 'Barely fires', color: '#c44b30' }
}

// ── NEATNESS LABEL + COLOR ───────────────────────
// Human-readable grade for a score value.

export function neatnessLabel(score) {
  if (score >= 80) return 'Pristine'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Passable'
  if (score >= 20) return 'Messy'
  return 'Chaotic'
}

export function neatnessColor(score) {
  if (score >= 80) return '#2d7a1a'
  if (score >= 60) return '#b8860b'
  if (score >= 40) return '#8b4513'
  if (score >= 20) return '#8b0000'
  return '#5a0000'
}

// ── SPELL STATE SUMMARY ──────────────────────────
// Single function that returns everything the UI needs.
// Call this whenever placed glyphs change.

export function getSpellState(placedGlyphs) {
  const neatness = computeNeatness(placedGlyphs)
  const isUnstable = hasConflicts(placedGlyphs)
  const totalPlaced = Object.keys(placedGlyphs).length
  const canCast = !!placedGlyphs['c0']

  if (!neatness) {
    return {
      neatness: null,
      duration: null,
      isUnstable: false,
      totalPlaced,
      canCast,
    }
  }

  const duration = neatnessToDuration(neatness.overall)

  return {
    neatness,       // { ring, sigil, balance, overall }
    duration,       // { pips, label, color }
    isUnstable,     // true if fire+water or light+shadow etc
    totalPlaced,
    canCast,
  }
}
