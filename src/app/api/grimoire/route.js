// ═══════════════════════════════════════════════
//  API ROUTE — /api/grimoire
//  GET  → fetch spells for community page
//  POST → like a spell
// ═══════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET /api/grimoire?element=fire&rarity=rare&page=1
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const element  = searchParams.get('element')
    const rarity   = searchParams.get('rarity')
    const page     = parseInt(searchParams.get('page') ?? '1')
    const limit    = 12
    const skip     = (page - 1) * limit

    // Build filter
    const filter = {}
    if (element && element !== 'all') filter.element = element
    if (rarity  && rarity  !== 'all') filter.rarity  = rarity

    const db     = await getDb()
    const spells = await db.collection('spells')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await db.collection('spells').countDocuments(filter)

    return NextResponse.json({
      success: true,
      spells,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })

  } catch (err) {
    console.error('Grimoire GET error:', err.message)
    return NextResponse.json(
      { success: false, error: 'Could not load grimoire.' },
      { status: 500 }
    )
  }
}

// POST /api/grimoire  body: { spellId }
export async function POST(request) {
  try {
    const { spellId } = await request.json()
    if (!spellId) {
      return NextResponse.json({ success: false, error: 'spellId required' }, { status: 400 })
    }

    const db = await getDb()
    await db.collection('spells').updateOne(
      { _id: new ObjectId(spellId) },
      { $inc: { likes: 1 } }
    )

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Grimoire POST error:', err.message)
    return NextResponse.json(
      { success: false, error: 'Could not update likes.' },
      { status: 500 }
    )
  }
}
