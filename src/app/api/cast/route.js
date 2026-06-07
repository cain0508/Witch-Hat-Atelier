// ═══════════════════════════════════════════════
//  API ROUTE v2 — /api/cast
//  Calls Gemini AND saves the spell to MongoDB
// ═══════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { generateSpell } from '@/lib/gemini'
import { getDb } from '@/lib/mongodb'
import { computeNeatness, neatnessToDuration } from '@/lib/spellLogic'

export async function POST(request) {
  try {
    const body = await request.json()
    const { placedGlyphs, saveToGrimoire = false } = body

    if (!placedGlyphs || !placedGlyphs['c0']) {
      return NextResponse.json(
        { success: false, error: 'Center glyph is required.' },
        { status: 400 }
      )
    }

    // Generate spell from Gemini
    const result = await generateSpell(placedGlyphs)

    // Save to MongoDB if user chose to
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
          likes:          0,
        })
      } catch (dbErr) {
        // DB save failed — still return the spell, just log the error
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
