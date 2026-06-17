// ═══════════════════════════════════════════════
//  GROQ — Spell prompt builder + API caller
//  Replaces Gemini with Groq (llama-3.1-8b-instant)
//  Used by: /api/cast/route.js (server side only)
// ═══════════════════════════════════════════════

import { GLYPHS } from './glyphs.js'
import { SLOTS, computeNeatness, neatnessToDuration } from './spellLogic.js'
import { SHAPES } from './shapes.js'
import { computeBlueprintScore } from './shapeLogic.js'

// ── MOCK MODE ────────────────────────────────────
const MOCK_MODE = !process.env.GROQ_API_KEY

const MOCK_SPELL = {
  spell_name:    "The Ember's Long Memory",
  rarity:        'rare',
  element:       'fire',
  lore:          'I drew the circle three times before the ink held true, each attempt steadier than the last. When Ignis finally caught within the Mora-ring, the flame that rose did not flicker — it simply waited, patient as a hearthstone.',
  duration_note: 'Held warmly for the better part of an evening',
}

// ── HELPERS ──────────────────────────────────────
function getGlyph(id) {
  return GLYPHS.find(g => g.id === id) ?? null
}

function getSlot(id) {
  return SLOTS.find(s => s.id === id) ?? null
}

function detectConflicts(placedGlyphs) {
  const ids = Object.values(placedGlyphs)
  const hasFire   = ids.includes('fire')
  const hasWater  = ids.includes('water')
  const hasLight  = ids.includes('light')
  const hasShadow = ids.includes('shadow')
  const innerPrimaries = ['i0','i1','i2','i3'].filter(slotId => {
    const g = getGlyph(placedGlyphs[slotId])
    return g?.type === 'primary'
  })
  return (hasFire && hasWater) ||
         (hasLight && hasShadow) ||
         innerPrimaries.length >= 2
}

// ── GROQ API CALL ────────────────────────────────
async function callGroq(prompt) {
  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.9,
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || `Groq error ${response.status}`)
  }

  const data = await response.json()
  const raw  = data.choices?.[0]?.message?.content ?? ''
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

// ── SINGLE CIRCLE PROMPT BUILDER ─────────────────
function buildPrompt(placedGlyphs) {
  const neatness   = computeNeatness(placedGlyphs)
  const duration   = neatnessToDuration(neatness.overall)
  const isUnstable = detectConflicts(placedGlyphs)
  const centerGlyph = getGlyph(placedGlyphs['c0'])

  const circleDesc = Object.entries(placedGlyphs)
    .map(([slotId, glyphId]) => {
      const glyph = getGlyph(glyphId)
      const slot  = getSlot(slotId)
      return `${glyph.name} (${slot.ring} ring)`
    })
    .join(', ')

  const neatDesc =
    neatness.overall >= 85 ? 'with exceptional precision' :
    neatness.overall >= 65 ? 'with adequate care' :
    neatness.overall >= 45 ? 'somewhat carelessly' :
                             'quite messily'

  const rarity =
    neatness.overall >= 85 && Object.keys(placedGlyphs).length >= 4 ? 'legendary' :
    neatness.overall >= 60 || Object.keys(placedGlyphs).length >= 3  ? 'rare' :
                                                                         'common'

  if (isUnstable) {
    return `You write grimoire entries for Witch Hat Atelier, a world where magic is drawn with ink. A witch drew a circle with conflicting elements: ${circleDesc}, drawn ${neatDesc}. It failed catastrophically.

Respond with ONLY raw JSON, no markdown:
{"spell_name":"dramatic failure name 2-4 words","rarity":"unstable","element":"${centerGlyph?.element ?? 'unknown'}","lore":"Two sentences, first-person past tense, apprentice describing the chaotic failure.","duration_note":"one short phrase about how briefly it lasted"}`
  }

  const durationHint =
    duration.pips >= 6 ? 'The spell held for a good duration.' :
    duration.pips >= 4 ? 'The spell faded fairly quickly.' :
                         'The spell barely fired, very brief.'

  return `You write grimoire entries for Witch Hat Atelier, a world where magic is drawn with ink. A witch drew a circle containing: ${circleDesc}, drawn ${neatDesc}. ${durationHint}

Respond with ONLY raw JSON, no markdown:
{"spell_name":"poetic spell name 2-4 words","rarity":"${rarity}","element":"${centerGlyph?.element ?? 'fire'}","lore":"Two sentences, first-person past tense grimoire note mentioning the glyphs used.","duration_note":"one evocative phrase about duration"}`
}

// ── BLUEPRINT PROMPT BUILDER ──────────────────────
function buildBlueprintPrompt(blueprint) {
  const { shapes, connectors = [] } = blueprint
  const score = computeBlueprintScore(blueprint)

  const shapeDescs = shapes.map(({ shapeId, placedGlyphs = {} }, idx) => {
    const shape = SHAPES.find(s => s.id === shapeId)
    const glyphNames = Object.values(placedGlyphs)
      .map(id => GLYPHS.find(g => g.id === id)?.name)
      .filter(Boolean)
      .join(', ')
    const connector = idx < shapes.length - 1
      ? ` connected via ${connectors[idx] ?? 'flow'}` : ''
    return `${shape?.name} [${glyphNames || 'empty'}]${connector}`
  }).join(', ')

  const neatDesc =
    score?.overall >= 85 ? 'with exceptional precision' :
    score?.overall >= 65 ? 'with adequate care' :
    score?.overall >= 45 ? 'somewhat carelessly' : 'quite messily'

  const primaryShape = SHAPES.find(s => s.id === shapes[0]?.shapeId)
  const isUnstable = score?.hasCatastrophic || score?.rarity === 'unstable'
  const ritualType = shapes.length === 1 ? 'single-shape working' :
                     shapes.length === 2 ? 'compound working' : 'full ritual'

  if (isUnstable) {
    return `You write grimoire entries for Witch Hat Atelier. A witch attempted a ${ritualType} with: ${shapeDescs}, drawn ${neatDesc}. It catastrophically failed.

Respond with ONLY raw JSON, no markdown:
{"spell_name":"dramatic failure name 2-4 words","rarity":"unstable","element":"${primaryShape?.affinity?.[0] ?? 'unknown'}","lore":"Two sentences, first-person past tense, describing the catastrophic collapse.","duration_note":"one phrase about how badly it failed"}`
  }

  return `You write grimoire entries for Witch Hat Atelier. A witch wove a ${ritualType} ${neatDesc} using: ${shapeDescs}.

Respond with ONLY raw JSON, no markdown:
{"spell_name":"poetic ritual name 2-4 words, grander than a single spell","rarity":"${score?.rarity ?? 'rare'}","element":"${primaryShape?.affinity?.[0] ?? 'fire'}","lore":"Two sentences, first-person past tense grimoire entry mentioning shape names and connectors.","duration_note":"one evocative phrase about duration"}`
}

// ── GENERATE SINGLE CIRCLE SPELL ─────────────────
export async function generateSpell(placedGlyphs) {
  if (MOCK_MODE) {
    await new Promise(r => setTimeout(r, 800))
    return { success: true, spell: MOCK_SPELL }
  }

  try {
    const spell = await callGroq(buildPrompt(placedGlyphs))
    return { success: true, spell }
  } catch (err) {
    console.error('Groq API error:', err.message)
    return {
      success: false,
      error: err.message,
      spell: {
        spell_name:    'The Fractured Working',
        rarity:        'common',
        element:       'unknown',
        lore:          'The ink refused to settle and the circle gave no answer. I shall try again when my hand is steadier.',
        duration_note: 'Did not fire',
      }
    }
  }
}

// ── GENERATE BLUEPRINT SPELL ──────────────────────
export async function generateBlueprintSpell(blueprint) {
  if (MOCK_MODE) {
    await new Promise(r => setTimeout(r, 800))
    const shapeNames = blueprint.shapes
      .map(s => SHAPES.find(sh => sh.id === s.shapeId)?.name)
      .filter(Boolean)
      .join(' + ')
    return {
      success: true,
      spell: {
        spell_name:    `The ${shapeNames} Accord`,
        rarity:        'rare',
        element:       'fire',
        lore:          'I wove the shapes together with careful hands, watching each connector take hold. The ritual held — a working larger than any single circle I had attempted before.',
        duration_note: 'Held steadily for the better part of an evening',
      }
    }
  }

  try {
    const spell = await callGroq(buildBlueprintPrompt(blueprint))
    return { success: true, spell }
  } catch (err) {
    console.error('Groq blueprint error:', err.message)
    return {
      success: false,
      error: err.message,
      spell: {
        spell_name:    'The Fractured Ritual',
        rarity:        'common',
        element:       'unknown',
        lore:          'The shapes refused to hold together. I shall study the connectors more carefully before attempting this combination again.',
        duration_note: 'Did not fire',
      }
    }
  }
}