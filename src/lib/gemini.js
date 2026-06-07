// ═══════════════════════════════════════════════
//  GEMINI — Spell prompt builder + API caller
//  This file builds the prompt from placed glyphs
//  and calls Google Gemini 2.0 Flash (free tier).
//
//  Used by: /api/cast/route.js (server side only)
//  Never import this directly in a component —
//  always go through the API route so the key
//  stays secret on the server.
// ═══════════════════════════════════════════════

import { GLYPHS } from './glyphs.js'
import { SLOTS, computeNeatness, neatnessToDuration } from './spellLogic.js'

// ── MOCK MODE ────────────────────────────────────
// Set to true while building UI — skips real API call
// and returns a fake spell instantly (zero cost).
// Set to false when you want to test real Gemini output.

const MOCK_MODE = false

const MOCK_SPELL = {
  spell_name:    'The Ember\'s Long Memory',
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

// ── PROMPT BUILDER ───────────────────────────────
// Builds the full prompt string sent to Gemini.
// The prompt changes based on neatness and stability.

function buildPrompt(placedGlyphs) {
  const neatness   = computeNeatness(placedGlyphs)
  const duration   = neatnessToDuration(neatness.overall)
  const isUnstable = detectConflicts(placedGlyphs)
  const centerGlyph = getGlyph(placedGlyphs['c0'])

  // Build a human-readable description of the circle
  const circleDesc = Object.entries(placedGlyphs)
    .map(([slotId, glyphId]) => {
      const glyph = getGlyph(glyphId)
      const slot  = getSlot(slotId)
      return `${glyph.name} (${slot.ring} ring)`
    })
    .join(', ')

  // Describe how neatly the circle was drawn
  const neatDesc =
    neatness.overall >= 85 ? 'with exceptional precision — every line crisp, every glyph perfectly formed' :
    neatness.overall >= 65 ? 'with adequate care — mostly clean with a few hesitant strokes' :
    neatness.overall >= 45 ? 'somewhat carelessly — uneven spacing, a few misaligned glyphs' :
                             'quite messily — shaky lines, poor ink control, visible hesitation throughout'

  // ── UNSTABLE SPELL PROMPT ──
  if (isUnstable) {
    return `You are writing entries in the grimoire of Witch Hat Atelier — a world where magic is drawn with ink and glyphs. A young witch has drawn a magic circle containing conflicting elements: ${circleDesc}. The circle was drawn ${neatDesc}.

The opposing elements destabilise the working catastrophically.

Respond with ONLY a valid JSON object — no markdown fences, no explanation, just the raw JSON:
{
  "spell_name": "a dramatic or tragicomic name for this backfire, 2–4 words",
  "rarity": "unstable",
  "element": "${centerGlyph.element}",
  "lore": "Exactly two sentences. First-person past tense, as if a flustered apprentice is scribbling this into their field journal moments after it happened. Mention what conflicted, what went wrong, and something slightly embarrassing or chaotic about the result. Voice: breathless, apologetic, a little self-deprecating.",
  "duration_note": "A short evocative phrase describing how briefly the misfire lasted — e.g. 'Gone before I could blink' or 'Just long enough to singe my sleeve'"
}`
  }

  // ── DURATION INSTRUCTION based on neatness ──
  const durationInstruction =
    duration.pips >= 8 ? 'The spell was exceptionally neat — the lore should note with quiet pride that it held for an impressive, sustained duration.' :
    duration.pips >= 6 ? 'The circle was drawn well — the lore should note the spell held steadily for a useful period.' :
    duration.pips >= 4 ? 'The circle was passable — the spell fired and faded fairly quickly. The lore can mention the brevity matter-of-factly.' :
    duration.pips >= 2 ? 'The circle was messy — the spell barely worked, a short sputtering burst. The lore should gently note the apprentice\'s imprecision caused the short duration.' :
                         'The circle was extremely messy — the spell almost failed entirely, just a faint flicker. The lore must note the shaky linework nearly killed the working.'

  // ── RARITY based on neatness + glyph count ──
  const glyphCount = Object.keys(placedGlyphs).length
  const rarity =
    neatness.overall >= 85 && glyphCount >= 4 ? 'legendary' :
    neatness.overall >= 60 || glyphCount >= 3  ? 'rare' :
                                                  'common'

  // ── NORMAL SPELL PROMPT ──
  return `You are writing entries in the grimoire of Witch Hat Atelier — a world where magic is learned by drawing precise glyphs into circles with ink. A witch has carefully drawn a magic circle containing: ${circleDesc}. The circle was drawn ${neatDesc}. Overall neatness score: ${neatness.overall}/100.

${durationInstruction}

Respond with ONLY a valid JSON object — no markdown fences, no explanation, just the raw JSON:
{
  "spell_name": "a poetic, evocative name for this spell, 2–4 words, in the manga's style — e.g. 'The Ember's Long Memory', 'Threaded Breath', 'Stone-Held Vigil', 'Tide That Waits'",
  "rarity": "${rarity}",
  "element": "${centerGlyph.element}",
  "lore": "Exactly two sentences. First-person past tense, written as a grimoire field note — as if a witch recorded discovering this spell. The voice should match neatness: pristine circle = confident, lyrical prose; messy circle = hesitant, self-correcting notes. Mention the specific glyphs used and naturally weave in how long the spell lasted.",
  "duration_note": "One short evocative phrase describing how long it lasted — tied to neatness. e.g. 'Held beautifully for the full measure of a long evening' or 'Sputtered out before I could count to three'"
}`
}

// ── GEMINI API CALL ──────────────────────────────
// Calls Gemini 2.0 Flash with the built prompt.
// Returns a parsed spell object.

export async function generateSpell(placedGlyphs) {

  // Return mock data instantly if mock mode is on
  if (MOCK_MODE) {
    await new Promise(r => setTimeout(r, 800)) // fake loading delay
    return { success: true, spell: MOCK_SPELL }
  }

  const prompt = buildPrompt(placedGlyphs)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro"-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature:     0.9,   // creative but not wild
            maxOutputTokens: 400,   // spell card is short
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

    // Extract text from Gemini response structure
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Strip markdown fences if Gemini adds them anyway
    const clean = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    // Parse the JSON spell object
    const spell = JSON.parse(clean)

    return { success: true, spell }

  } catch (err) {
    console.error('Gemini API error:', err.message)
    return {
      success: false,
      error: err.message,
      // Fallback spell so the UI never fully breaks
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
