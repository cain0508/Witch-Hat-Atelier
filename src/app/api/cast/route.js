// ═══════════════════════════════════════════════
//  API ROUTE v3 — /api/cast
//  Handles both single circle spells AND
//  multi-shape blueprint rituals.
// ═══════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { generateSpell, generateBlueprintSpell } from '@/lib/gemini'
import { getDb } from '@/lib/mongodb'
import { computeNeatness, neatnessToDuration } from '@/lib/spellLogic'
import { computeBlueprintScore, shapeToDuration } from '@/lib/shapeLogic'
import { SHAPES } from '@/lib/shapes'
import { GLYPHS } from '@/lib/glyphs'

export async function POST(request) {
  try {
    const body = await request.json()
    const { placedGlyphs, blueprint, isBlueprint = false, saveToGrimoire = false } = body

    // ── BLUEPRINT RITUAL ──
    if (isBlueprint && blueprint) {
      if (!blueprint.shapes || blueprint.shapes.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Add at least one shape to cast a ritual.' },
          { status: 400 }
        )
      }

      const result = await generateBlueprintSpell(blueprint)

      if (saveToGrimoire && result.success) {
        try {
          const db    = await getDb()
          const score = computeBlueprintScore(blueprint)
          const primaryShapeId = blueprint.shapes[0]?.shapeId ?? 'circle'
          const duration = score ? shapeToDuration(primaryShapeId, score.overall) : null
          const allGlyphs = blueprint.shapes.reduce((acc, s) => ({ ...acc, ...s.placedGlyphs }), {})

          await db.collection('spells').insertOne({
            createdAt:      new Date(),
            spellName:      result.spell.spell_name,
            rarity:         result.spell.rarity,
            element:        result.spell.element,
            lore:           result.spell.lore,
            durationNote:   result.spell.duration_note ?? '',
            durationLabel:  duration?.label ?? '',
            durationPips:   duration?.pips  ?? 0,
            neatnessOverall:score?.overall   ?? 0,
            placedGlyphs:   allGlyphs,
            blueprint,
            isRitual:       true,
            likes:          0,
          })
        } catch (dbErr) {
          console.error('MongoDB blueprint save error:', dbErr.message)
        }
      }

      return NextResponse.json(result)
    }

    // ── SINGLE CIRCLE SPELL ──
    if (!placedGlyphs || !placedGlyphs['c0']) {
      return NextResponse.json(
        { success: false, error: 'Center glyph is required to cast a spell.' },
        { status: 400 }
      )
    }

    const result = await generateSpell(placedGlyphs)

    if (saveToGrimoire && result.success) {
      try {
        const db       = await getDb()
        const neatness = computeNeatness(placedGlyphs)
        const duration = neatness ? neatnessToDuration(neatness.overall) : null

        await db.collection('spells').insertOne({
          createdAt:      new Date(),
          spellName:      result.spell.spell_name,
          rarity:         result.spell.rarity,
          element:        result.spell.element,
          lore:           result.spell.lore,
          durationNote:   result.spell.duration_note ?? '',
          durationLabel:  duration?.label ?? '',
          durationPips:   duration?.pips  ?? 0,
          neatnessOverall:neatness?.overall ?? 0,
          placedGlyphs,
          isRitual:       false,
          likes:          0,
        })
      } catch (dbErr) {
        console.error('MongoDB save error:', dbErr.message)
      }
    }

    return NextResponse.json(result)

  } catch (err) {
    console.error('Cast route error:', err.message)
    return NextResponse.json(
      { success: false, error: 'The circle could not be read.' },
      { status: 500 }
    )
  }
}
