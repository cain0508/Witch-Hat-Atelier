// ═══════════════════════════════════════════════
//  SHAPE LOGIC — Phase 4 scoring engine
//  Computes neatness, harmony, and spell power
//  for single shapes and multi-shape blueprints.
// ═══════════════════════════════════════════════

import { SHAPES, CONNECTORS, NODE_GROUPS, SLOT_ROLES, getShape, hasAffinity, areSameGroup, validateBlueprintOrder } from './shapes.js'
import { GLYPHS } from './glyphs.js'

// ── GET GLYPH ─────────────────────────────────────
function getGlyph(id) {
  return GLYPHS.find(g => g.id === id) ?? null
}

// ══════════════════════════════════════════════════
//  SINGLE SHAPE SCORING
// ══════════════════════════════════════════════════

// ── SLOT HARMONY SCORE ────────────────────────────
// How well do the placed glyphs work with this shape?
// Checks: affinity bonus, node group support, role matching
export function slotHarmonyScore(shapeId, placedGlyphs) {
  const shape = getShape(shapeId)
  if (!shape) return 0

  const filledSlots = Object.entries(placedGlyphs).filter(([,v]) => v)
  if (filledSlots.length === 0) return 0

  let totalScore = 0
  let count = 0

  filledSlots.forEach(([slotId, glyphId]) => {
    const slot  = shape.slots.find(s => s.id === slotId)
    const glyph = getGlyph(glyphId)
    if (!slot || !glyph) return

    let score = 60 // base score

    // Affinity bonus — element matches shape's preferred elements
    if (hasAffinity(shapeId, glyph.element)) score += 20

    // Role match bonus — primary glyph in core slot
    if (slot.role === SLOT_ROLES.CORE && glyph.type === 'primary') score += 15
    if (slot.role === SLOT_ROLES.AMPLIFIER && glyph.type === 'primary') score += 10
    if (slot.role === SLOT_ROLES.SUPPORT && glyph.type === 'modifier') score += 10

    // Node group support — same group glyphs that match element
    const sameGroupSlots = shape.slots.filter(s =>
      s.id !== slotId && areSameGroup(s, slot) && placedGlyphs[s.id]
    )
    const sameGroupGlyphs = sameGroupSlots
      .map(s => getGlyph(placedGlyphs[s.id]))
      .filter(Boolean)

    // Same group + same element = strong harmony
    const sameElement = sameGroupGlyphs.filter(g => g.element === glyph.element)
    score += sameElement.length * 8

    totalScore += Math.min(100, score)
    count++
  })

  return count > 0 ? Math.round(totalScore / count) : 0
}

// ── SLOT SYMMETRY SCORE ───────────────────────────
// How evenly distributed are glyphs across the shape?
// Full shape = 100. Uneven = penalty.
export function slotSymmetryScore(shapeId, placedGlyphs) {
  const shape = getShape(shapeId)
  if (!shape) return 0

  const totalSlots  = shape.slots.length
  const filledCount = Object.values(placedGlyphs).filter(Boolean).length

  if (filledCount === 0) return 0
  if (filledCount === totalSlots) return 100

  // Check node group balance
  const aceSlots = shape.slots.filter(s => s.group === NODE_GROUPS.ACE)
  const bfdSlots = shape.slots.filter(s => s.group === NODE_GROUPS.BFD)

  const aceFilled = aceSlots.filter(s => placedGlyphs[s.id]).length
  const bfdFilled = bfdSlots.filter(s => placedGlyphs[s.id]).length

  let score = (filledCount / totalSlots) * 80

  // Bonus for balanced node groups
  if (aceSlots.length > 0 && bfdSlots.length > 0) {
    const balance = 1 - Math.abs(aceFilled - bfdFilled) / Math.max(aceSlots.length, bfdSlots.length)
    score += balance * 20
  }

  return Math.round(Math.min(100, score))
}

// ── CONFLICT SCORE ────────────────────────────────
// Penalties for conflicting elements
// Shape-specific rules applied here
export function conflictScore(shapeId, placedGlyphs) {
  const shape   = getShape(shapeId)
  const glyphIds = Object.values(placedGlyphs).filter(Boolean)

  if (glyphIds.length < 2) return 100

  let score = 100

  const hasFire   = glyphIds.includes('fire')
  const hasWater  = glyphIds.includes('water')
  const hasLight  = glyphIds.includes('light')
  const hasShadow = glyphIds.includes('shadow')

  // Special shapes that resolve conflicts
  if (shapeId === 'vesica') {
    // Vesica resolves all conflicts — no penalty
    return 100
  }

  if (shapeId === 'trispell') {
    // Tri-spell reduces conflict penalty by half
    if (hasFire && hasWater) score -= 15
    if (hasLight && hasShadow) score -= 12
    return Math.max(40, score)
  }

  if (shapeId === 'square') {
    // Square contains conflicts — smaller penalty
    if (hasFire && hasWater) score -= 20
    if (hasLight && hasShadow) score -= 15
    return Math.max(50, score)
  }

  // Standard conflict penalties
  if (hasFire && hasWater)  score -= 35
  if (hasLight && hasShadow) score -= 28

  // Star shape — conflicts are controlled, less penalty
  if (shapeId === 'star') score = Math.min(100, score + 15)

  return Math.max(20, score)
}

// ── OVERALL SHAPE NEATNESS ────────────────────────
// Combines all three sub-scores for a single shape
export function computeShapeNeatness(shapeId, placedGlyphs) {
  const filledCount = Object.values(placedGlyphs).filter(Boolean).length
  if (filledCount === 0) return null

  const harmony   = slotHarmonyScore(shapeId, placedGlyphs)
  const symmetry  = slotSymmetryScore(shapeId, placedGlyphs)
  const conflict  = conflictScore(shapeId, placedGlyphs)

  // Star forces legendary if all 6 filled
  const shape = getShape(shapeId)
  const allFilled = filledCount === shape?.slots?.length

  if (shapeId === 'star' && allFilled) {
    return { harmony, symmetry, conflict, overall: 95, forcedLegendary: true }
  }

  // Star catastrophic misfire if not all filled
  if (shapeId === 'star' && !allFilled && filledCount > 0) {
    return { harmony, symmetry, conflict, overall: 5, catastrophic: true }
  }

  const overall = Math.round(
    harmony  * 0.40 +
    symmetry * 0.35 +
    conflict * 0.25
  )

  return { harmony, symmetry, conflict, overall }
}

// ── DURATION MAPPING ─────────────────────────────
// Same as Phase 1 but shape modifies the result
export function shapeToDuration(shapeId, neatnessOverall) {
  // Base duration from neatness
  let pips =
    neatnessOverall >= 90 ? 8 :
    neatnessOverall >= 70 ? 6 :
    neatnessOverall >= 50 ? 4 :
    neatnessOverall >= 30 ? 2 : 1

  // Shape modifiers
  if (shapeId === 'circle')   pips = Math.min(8, pips + 1)  // circle = sustain bonus
  if (shapeId === 'spiral')   pips = Math.min(8, pips + 2)  // spiral = time bonus
  if (shapeId === 'triangle') pips = Math.max(1, pips - 1)  // triangle = burst, shorter
  if (shapeId === 'star')     pips = 8                      // star all filled = max

  const labels = {8:'Enduring',6:'Sustained',4:'Brief',2:'Fleeting',1:'Barely fires'}
  const colors = {8:'#4ecdc4',6:'#5cb85c',4:'#c9a84c',2:'#e8593c',1:'#c44b30'}

  return { pips, label: labels[pips] ?? 'Brief', color: colors[pips] ?? '#c9a84c' }
}

// ══════════════════════════════════════════════════
//  MULTI-SHAPE BLUEPRINT SCORING
// ══════════════════════════════════════════════════

// ── CONNECTOR SCORE ───────────────────────────────
// How well does the connector type match the shapes?
export function connectorScore(shapeId1, shapeId2, connectorType) {
  const s1 = getShape(shapeId1)
  const s2 = getShape(shapeId2)
  if (!s1 || !s2) return 50

  let score = 70 // base

  // Natural connector pairings give bonus
  const naturalPairs = {
    flow:   [['triangle','circle'],['circle','pentagon'],['triangle','pentagon']],
    mirror: [['pentagon','hexagon'],['circle','circle'],['square','square']],
    gate:   [['circle','star'],['hexagon','star'],['pentagon','spiral']],
    drain:  [['circle','spiral'],['pentagon','spiral'],['hexagon','spiral']],
    oppose: [['triangle','pentagon'],['fire','water'],['star','circle']],
  }

  const pairs = naturalPairs[connectorType] ?? []
  const isNatural = pairs.some(([a,b]) =>
    (shapeId1 === a && shapeId2 === b) ||
    (shapeId1 === b && shapeId2 === a)
  )
  if (isNatural) score += 20

  // Trispell as connector always scores well
  if (shapeId1 === 'trispell' || shapeId2 === 'trispell') score += 15

  // Oppose connector is always risky
  if (connectorType === CONNECTORS.OPPOSE) score = Math.max(30, score - 20)

  return Math.min(100, score)
}

// ── BLUEPRINT OVERALL SCORE ───────────────────────
// Combines all shape scores + connector scores
export function computeBlueprintScore(blueprint) {
  // blueprint = { shapes: [{ shapeId, placedGlyphs }], connectors: ['flow', 'mirror'] }
  const { shapes, connectors = [] } = blueprint

  if (!shapes || shapes.length === 0) return null

  // Score each shape individually
  const shapeScores = shapes.map(({ shapeId, placedGlyphs }) => {
    const neatness = computeShapeNeatness(shapeId, placedGlyphs)
    return neatness?.overall ?? 0
  })

  const avgShapeScore = Math.round(
    shapeScores.reduce((a, b) => a + b, 0) / shapeScores.length
  )

  // Score connectors
  const connectorScores = connectors.map((type, i) => {
    const s1 = shapes[i]?.shapeId
    const s2 = shapes[i + 1]?.shapeId
    return s1 && s2 ? connectorScore(s1, s2, type) : 70
  })

  const avgConnectorScore = connectorScores.length > 0
    ? Math.round(connectorScores.reduce((a, b) => a + b, 0) / connectorScores.length)
    : 100

  // Overall blueprint neatness
  const overall = Math.round(avgShapeScore * 0.7 + avgConnectorScore * 0.3)

  // Check for special conditions
  const hasCatastrophic = shapes.some(({ shapeId, placedGlyphs }) => {
    const n = computeShapeNeatness(shapeId, placedGlyphs)
    return n?.catastrophic
  })

  const hasForcedLegendary = shapes.every(({ shapeId, placedGlyphs }) => {
    const n = computeShapeNeatness(shapeId, placedGlyphs)
    return n?.forcedLegendary || (n?.overall ?? 0) >= 85
  })

  return {
    shapeScores,
    connectorScores,
    overall,
    hasCatastrophic,
    hasForcedLegendary,
    rarity: hasForcedLegendary ? 'legendary' :
            overall >= 75 ? 'rare' :
            overall >= 45 ? 'common' : 'unstable',
  }
}

// ── BLUEPRINT STATE ───────────────────────────────
// Single function the UI calls to get everything
export function getBlueprintState(blueprint) {
  const score = computeBlueprintScore(blueprint)
  const orderValidation = validateBlueprintOrder(blueprint.shapes)
  
  const canCast = orderValidation.valid && (blueprint.shapes?.some(s =>
    Object.values(s.placedGlyphs ?? {}).some(Boolean)
  ) ?? false)

  if (!score) return { score: null, canCast, duration: null, validationError: orderValidation.error }

  const primaryShape = blueprint.shapes?.[0]?.shapeId ?? 'circle'
  const duration     = shapeToDuration(primaryShape, score.overall)

  return { score, canCast, duration, validationError: orderValidation.error }
}
