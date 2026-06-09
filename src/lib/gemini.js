// ═══════════════════════════════════════════════
//  GEMINI — Spell prompt builder + API caller
//  This file builds the prompt from placed glyphs
//  and calls Google Gemini API.
//
//  Used by: /api/cast/route.js (server side only)
// ═══════════════════════════════════════════════

import { GLYPHS } from './glyphs.js'
import { SLOTS, computeNeatness, neatnessToDuration } from './spellLogic.js'
import { SHAPES } from './shapes.js'
import { computeBlueprintScore, shapeToDuration } from './shapeLogic.js'

// ── MOCK MODE ────────────────────────────────────
// Set to true if API key is missing to return offline mock data gracefully.
const MOCK_MODE = !process.env.GEMINI_API_KEY

const MOCK_SPELL = {
  spell_name:    "The Ember's Long Memory",
  rarity:        'rare',
  element:       'fire',
  lore:          'I drew the circle three times before the ink held true, each attempt steadier than the last. When Ignis finally caught within the Mora-ring, the flame that rose did not flicker — it simply waited, patient as a hearthstone, enduring long past the candle I lit to see by.',
  duration_note: 'Held warmly for the better part of an evening',
}

// ── HELPERS ──────────────────────────────────────

// Get glyph object from id
function getGlyph(id) {
  return GLYPHS.find(g => g.id === id) ?? null
}

// Get slot object from id
function getSlot(id) {
  return SLOTS.find(s => s.id === id) ?? null
}

// Check if placed glyphs contain conflicting elements
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
    neatness.overall >= 85 ? 'with exceptional precision — every line crisp, every glyph perfectly formed' :
    neatness.overall >= 65 ? 'with adequate care — mostly clean with a few hesitant strokes' :
    neatness.overall >= 45 ? 'somewhat carelessly — uneven spacing, a few misaligned glyphs' :
                             'quite messily — shaky lines, poor ink control, visible hesitation throughout'

  if (isUnstable) {
    return `You are writing entries in the grimoire of Witch Hat Atelier — a world where magic is drawn with ink and glyphs. A young witch has drawn a magic circle containing conflicting elements: ${circleDesc}. The circle was drawn ${neatDesc}.

The opposing elements destabilise the working catastrophically.

Respond with ONLY a valid JSON object — no markdown fences, no explanation, just the raw JSON:
{
  "spell_name": "a dramatic or tragicomic name for this backfire, 2–4 words",
  "rarity": "unstable",
  "element": "${centerGlyph ? centerGlyph.element : 'unknown'}",
  "lore": "Exactly two sentences. First-person past tense, as if a flustered apprentice is scribbling this into their field journal moments after it happened. Mention what conflicted, what went wrong, and something slightly embarrassing or chaotic about the result. Voice: breathless, apologetic, a little self-deprecating.",
  "duration_note": "A short evocative phrase describing how briefly the misfire lasted — e.g. 'Gone before I could blink' or 'Just long enough to singe my sleeve'"
}`
  }

  const durationInstruction =
    duration.pips >= 8 ? 'The spell was exceptionally neat — the lore should note with quiet pride that it held for an impressive, sustained duration.' :
    duration.pips >= 6 ? 'The circle was drawn well — the lore should note the spell held steadily for a useful period.' :
    duration.pips >= 4 ? 'The circle was passable — the spell fired and faded fairly quickly. The lore can mention the brevity matter-of-factly.' :
    duration.pips >= 2 ? 'The circle was messy — the spell barely worked, a short sputtering burst. The lore should gently note the apprentice\'s imprecision caused the short duration.' :
                         'The circle was extremely messy — the spell almost failed entirely, just a faint flicker. The lore must note the shaky linework nearly killed the working.'

  const glyphCount = Object.keys(placedGlyphs).length
  const rarity =
    neatness.overall >= 85 && glyphCount >= 4 ? 'legendary' :
    neatness.overall >= 60 || glyphCount >= 3  ? 'rare' :
                                                  'common'

  return `You are writing entries in the grimoire of Witch Hat Atelier — a world where magic is learned by drawing precise glyphs into circles with ink. A witch has carefully drawn a magic circle containing: ${circleDesc}. The circle was drawn ${neatDesc}. Overall neatness score: ${neatness.overall}/100.

${durationInstruction}

Respond with ONLY a valid JSON object — no markdown fences, no explanation, just the raw JSON:
{
  "spell_name": "a poetic, evocative name for this spell, 2–4 words, in the manga's style — e.g. 'The Ember's Long Memory', 'Threaded Breath', 'Stone-Held Vigil', 'Tide That Waits'",
  "rarity": "${rarity}",
  "element": "${centerGlyph ? centerGlyph.element : 'fire'}",
  "lore": "Exactly two sentences. First-person past tense, written as a grimoire field note — as if a witch recorded discovering this spell. The voice should match neatness: pristine circle = confident, lyrical prose; messy circle = hesitant, self-correcting notes. Mention the specific glyphs used and naturally weave in how long the spell lasted.",
  "duration_note": "One short evocative phrase describing how long it lasted — tied to neatness. e.g. 'Held beautifully for the full measure of a long evening' or 'Sputtered out before I could count to three'"
}`
}

// ── BLUEPRINT PROMPT BUILDER ─────────────────
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
      ? ` Connected via ${connectors[idx] ?? 'flow'} to the next shape.`
      : ''

    return `Shape ${idx + 1}: ${shape?.name} (${shape?.subtitle}) containing [${glyphNames || 'empty'}].${connector}`
  })

  const shapeCount = shapes.length
  const ritualType = shapeCount === 1 ? 'single-shape working' :
                     shapeCount === 2 ? 'compound working' : 'full ritual'

  const neatDesc = score
    ? score.overall >= 85 ? 'drawn with exceptional precision'
    : score.overall >= 65 ? 'drawn with adequate care'
    : score.overall >= 45 ? 'drawn somewhat carelessly'
    : 'drawn quite messily'
    : 'drawn with unknown precision'

  const primaryShape = SHAPES.find(s => s.id === shapes[0]?.shapeId)
  const isUnstable = score?.hasCatastrophic || score?.rarity === 'unstable'

  if (isUnstable) {
    return `You are writing entries in the grimoire of Witch Hat Atelier. A witch attempted a ${ritualType} ${neatDesc}. The blueprint contained: ${shapeDescs.join(' ')} The ritual catastrophically failed.

Respond with ONLY valid JSON — no markdown:
{"spell_name":"[dramatic catastrophic name]","rarity":"unstable","element":"${primaryShape?.affinity?.[0] ?? 'unknown'}","lore":"[Two sentences — first person past tense — describing the catastrophic collapse of the multi-shape ritual. Mention the shapes by name. Voice: horrified apprentice.]","duration_note":"[One phrase — how badly it failed]"}`
  }

  return `You are writing entries in the grimoire of Witch Hat Atelier. A witch has woven a ${ritualType} ${neatDesc}. The blueprint: ${shapeDescs.join(' ')} Overall ritual quality: ${score?.overall ?? 50}/100.

The ${primaryShape?.name} shape brings ${primaryShape?.quality}. ${shapes.length > 1 ? `The shapes are connected by ${connectors.join(' and ')} connectors.` : ''}

Respond with ONLY valid JSON — no markdown:
{"spell_name":"[poetic ritual name, 2-4 words, grander than a single spell — e.g. 'The Threefold Unmaking', 'Ward of Enduring Stone', 'Recursive Flame Accord']","rarity":"${score?.rarity ?? 'rare'}","element":"${primaryShape?.affinity?.[0] ?? 'fire'}","lore":"[Exactly two sentences. First-person past tense grimoire entry. Mention the shape names and connector types naturally. Voice matches neatness — pristine = proud and lyrical, messy = hesitant. For multi-shape blueprints, describe how the shapes worked together.]","duration_note":"[One evocative phrase about how long the ritual held]"}`
}

// ── GEMINI API CALL FOR SINGLE CIRCLE ───────────
export async function generateSpell(placedGlyphs) {
  if (MOCK_MODE) {
    await new Promise(r => setTimeout(r, 800))
    return { success: true, spell: MOCK_SPELL }
  }

  const prompt = buildPrompt(placedGlyphs)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature:     0.9,
            maxOutputTokens: 400,
            topP:            0.95,
          },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message || `Gemini error ${response.status}`)
    }

    const data = await response.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const spell = JSON.parse(clean)

    return { success: true, spell }

  } catch (err) {
    console.error('Gemini API error:', err.message)
    return {
      success: false,
      error: err.message,
      spell: {
        spell_name:    'The Fractured Working',
        rarity:        'common',
        element:       'unknown',
        lore:          'The ink refused to settle and the circle gave no answer. I shall try again when my hand is steadier and the light is better.',
        duration_note: 'Did not fire',
      }
    }
  }
}

// ── GEMINI API CALL FOR BLUEPRINT RITUAL ────────
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
        lore:          'I wove the shapes together with careful hands, watching each connector take hold. When the final glyph settled, the ritual held — a working larger than any single circle I had attempted before.',
        duration_note: 'Held steadily for the better part of an evening',
      }
    }
  }

  const prompt = buildBlueprintPrompt(blueprint)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature:     0.9,
            maxOutputTokens: 400,
            topP:            0.95,
          },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message || `Gemini error ${response.status}`)
    }

    const data  = await response.json()
    const raw   = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const spell = JSON.parse(clean)

    return { success: true, spell }

  } catch (err) {
    console.error('Gemini blueprint error:', err.message)
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
