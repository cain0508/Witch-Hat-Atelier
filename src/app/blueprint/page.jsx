// ═══════════════════════════════════════════════
//  BLUEPRINT PAGE — /blueprint
//  Phase 4 multi-shape spell builder.
//  Binds picker, canvas, glyph selection, and
//  ritual casting state.
// ═══════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ShapePicker from '@/components/ShapePicker'
import BlueprintCanvas from '@/components/BlueprintCanvas'
import GlyphPicker from '@/components/GlyphPicker'
import SpellCard from '@/components/SpellCard'
import NeatnessMeter from '@/components/NeatnessMeter'
import UnlockToast from '@/components/UnlockToast'
import SaveButton from '@/components/SaveButton'
import { getBlueprintState } from '@/lib/shapeLogic'
import { CONNECTORS } from '@/lib/shapes'
import { loadUnlockedIds, saveUnlockedIds, checkForUnlock } from '@/lib/unlocks'

const EMPTY_BLUEPRINT = { shapes: [], connectors: [] }

export default function BlueprintPage() {
  const [blueprint, setBlueprint] = useState(EMPTY_BLUEPRINT)
  const [selectedGlyph, setSelectedGlyph] = useState(null)
  const [blueprintState, setBlueprintState] = useState(null)
  const [spell, setSpell] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeUnlock, setActiveUnlock] = useState(null)
  const [triggerCastAnim, setTriggerCastAnim] = useState(false)

  const [unlockedIds, setUnlockedIds] = useState(() => {
    if (typeof window === 'undefined') return ['fire', 'water', 'wind', 'earth', 'light', 'shadow', 'time', 'duration', 'focus', 'spread', 'anchor']
    return loadUnlockedIds()
  })

  // Recompute blueprint state whenever blueprint changes
  useEffect(() => {
    if (blueprint.shapes.length === 0) {
      setBlueprintState(null)
      return
    }
    const state = getBlueprintState(blueprint)
    setBlueprintState(state)
  }, [blueprint])

  // ── ADD SHAPE ──
  function handleAddShape(shapeId) {
    if (blueprint.shapes.length >= 3) return
    setBlueprint(prev => {
      const newShapes = [...prev.shapes, { shapeId, placedGlyphs: {} }]
      const newConnectors = [...prev.connectors]
      if (newShapes.length > 1) {
        newConnectors.push(CONNECTORS.FLOW)
      }
      return { shapes: newShapes, connectors: newConnectors }
    })
  }

  // ── REMOVE SHAPE ──
  function handleRemoveShape(index) {
    setBlueprint(prev => {
      const shapes = prev.shapes.filter((_, i) => i !== index)
      const connectors = prev.connectors.filter((_, i) => i !== index - 1 && i !== index)
      return { shapes, connectors }
    })
  }

  // ── PLACE GLYPH ──
  function handlePlaceGlyph(shapeIndex, slotId) {
    setBlueprint(prev => {
      const shapes = prev.shapes.map((s, i) => {
        if (i !== shapeIndex) return s
        const currentGlyph = s.placedGlyphs[slotId]
        const nextGlyphs = { ...s.placedGlyphs }

        if (!selectedGlyph || currentGlyph === selectedGlyph) {
          delete nextGlyphs[slotId]
        } else {
          nextGlyphs[slotId] = selectedGlyph
        }
        return { ...s, placedGlyphs: nextGlyphs }
      })
      return { ...prev, shapes }
    })
  }

  // ── CONNECTOR CHANGE ──
  function handleConnectorChange(index, type) {
    setBlueprint(prev => {
      const connectors = [...(prev.connectors ?? [])]
      connectors[index] = type
      return { ...prev, connectors }
    })
  }

  // ── CLEAR ──
  function handleClear() {
    setBlueprint(EMPTY_BLUEPRINT)
    setSelectedGlyph(null)
    setSpell(null)
    setError(null)
  }

  // ── CAST ──
  async function handleCast() {
    if (!blueprintState?.canCast || isLoading) return
    setIsLoading(true)
    setSpell(null)
    setError(null)

    setTriggerCastAnim(true)
    setTimeout(() => setTriggerCastAnim(false), 50) // reset after one frame

    try {
      const res = await fetch('/api/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint, isBlueprint: true }),
      })
      const data = await res.json()
      if (data.success) {
        setSpell(data.spell)

        // ── Local Storage Statistics Updates for Shape Unlocks ──
        const allPlacedList = blueprint.shapes.flatMap(s => Object.values(s.placedGlyphs ?? {}))
        const isFireWaterUnstable = data.spell.rarity === 'unstable' && allPlacedList.includes('fire') && allPlacedList.includes('water')

        const currentSpells = parseInt(localStorage.getItem('wha_spells_cast_count') || '0', 10)
        localStorage.setItem('wha_spells_cast_count', (currentSpells + 1).toString())

        if (data.spell.rarity === 'legendary') {
          const currentLegendary = parseInt(localStorage.getItem('wha_legendary_cast_count') || '0', 10)
          localStorage.setItem('wha_legendary_cast_count', (currentLegendary + 1).toString())
        }

        if (isFireWaterUnstable) {
          localStorage.setItem('wha_cast_fire_water_unstable', 'true')
        }

        // ── Check for new glyph unlock ──
        const allPlacedMap = blueprint.shapes.reduce((acc, s) => ({ ...acc, ...s.placedGlyphs }), {})
        const unlock = checkForUnlock(allPlacedMap, unlockedIds)
        if (unlock) {
          setTimeout(() => {
            setActiveUnlock(unlock)
            const newIds = [...unlockedIds, unlock.glyph.id]
            setUnlockedIds(newIds)
            saveUnlockedIds(newIds)
          }, 1200)
        }
      } else {
        setError(data.error ?? 'The blueprint could not be read.')
        setSpell(data.spell ?? null)
      }
    } catch (err) {
      setError('Connection lost. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const canCast = blueprintState?.canCast && !isLoading

  // Prepare neatness stats for NeatnessMeter
  const shapeScores = blueprintState?.score?.shapeScores ?? []
  const connectorScores = blueprintState?.score?.connectorScores ?? []
  const avgShapeScore = shapeScores.length > 0
    ? Math.round(shapeScores.reduce((a, b) => a + b, 0) / shapeScores.length)
    : 0
  const avgConnectorScore = connectorScores.length > 0
    ? Math.round(connectorScores.reduce((a, b) => a + b, 0) / connectorScores.length)
    : 100

  return (
    <main className="min-h-screen bg-[#d4b483] text-[#3b1f0a] relative overflow-x-hidden">

      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,165,90,0.15) 0%, transparent 70%)' }}
      />
      {/* Decorative rune strip along the bottom */}
      <div className="fixed bottom-0 left-0 w-full overflow-hidden opacity-30 pointer-events-none select-none" style={{ color: '#b8860b', fontSize: '11px', letterSpacing: '6px', whiteSpace: 'nowrap' }}>
        {'ᚠᚢᚦᚨᚱᚲ'.repeat(50)}
      </div>

      <div className="relative z-10 max-w-[1300px] mx-auto px-4 py-5">

        {/* HEADER */}
        <header className="text-center mb-6 pb-4 border-b-[3px] border-double border-[#a07840]">
          <p className="font-cinzel text-[9px] tracking-[4px] text-[#a07840] uppercase mb-2">
            ✦ ENCHANTED BLUEPRINT FORGE ✦
          </p>
          <h1 className="font-cinzel text-[26px] font-bold text-[#3b1f0a] mb-1 font-semibold"
            style={{ textShadow: '0 1px 0 rgba(255,220,150,0.4)' }}>
            Witch Hat Atelier — Sigil Forge
          </h1>
          <p className="text-[13px] italic text-[#7a4f1a]"
            style={{ fontFamily: 'var(--font-im-fell, serif)' }}>
            Combine shapes. Arrange connectors. Cast the multi-shape blueprint.
          </p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <Link href="/" className="font-cinzel text-[10px] tracking-[1.5px] uppercase px-4 py-2 rounded-[3px] border-[2px] border-[#7a4f1a] bg-[#c9a55a] text-[#2b1500] hover:bg-[#b8935a] transition-all shadow-[2px_4px_12px_rgba(80,40,0,0.3)]">
              ← Single Forge
            </Link>
            <Link href="/grimoire" className="font-cinzel text-[10px] tracking-[1.5px] uppercase px-4 py-2 rounded-[3px] border-[2px] border-[#7a4f1a] bg-[#c9a55a] text-[#2b1500] hover:bg-[#b8935a] transition-all shadow-[2px_4px_12px_rgba(80,40,0,0.3)]">
              Grimoire →
            </Link>
          </div>
        </header>

        {/* FOUR COLUMN LAYOUT */}
        <div className="grid grid-cols-[200px_1fr_200px_270px] gap-4 items-start">

          {/* COL 1 — Shape Picker */}
          <div className="h-[520px]">
            <ShapePicker
              selectedShapes={blueprint.shapes.map(s => s.shapeId)}
              onAddShape={handleAddShape}
              onRemoveShape={handleRemoveShape}
              maxShapes={3}
            />
          </div>

          {/* COL 2 — Blueprint Canvas */}
          <div className="flex flex-col items-center gap-4">
            {blueprint.shapes.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full h-[380px] border border-dashed border-[#a07840] rounded-[4px] bg-[rgba(255,255,255,0.1)] p-8">
                <div className="text-[32px] opacity-40 text-[#b8860b] mb-3">◈</div>
                <p className="font-cinzel text-[11px] tracking-[1px] text-[#7a4f1a] text-center">
                  Select a blueprint shape on the left to begin weaving the ritual.
                </p>
              </div>
            ) : (
              <BlueprintCanvas
                blueprint={blueprint}
                selectedGlyph={selectedGlyph}
                onPlaceGlyph={handlePlaceGlyph}
                onConnectorChange={handleConnectorChange}
                neatness={blueprintState?.score}
                triggerCastAnim={triggerCastAnim}
                onCastAnimComplete={() => {}}
              />
            )}

            {/* Validation & Guide Hints */}
            {blueprintState?.validationError && (
              <div className="w-full max-w-[600px] bg-[rgba(196,75,48,0.08)] border border-[#a07840] rounded-[4px] px-4 py-2.5 text-[11px] font-cinzel text-[#8b0000] text-center">
                ⚠️ {blueprintState.validationError}
              </div>
            )}

            {/* Neatness Meter */}
            {blueprintState?.score && (
              <div className="w-full max-w-[600px] mt-2">
                <NeatnessMeter
                  neatness={{
                    ring: avgShapeScore,
                    sigil: avgShapeScore,
                    balance: avgConnectorScore,
                    overall: blueprintState.score.overall,
                  }}
                  duration={blueprintState.duration}
                />
              </div>
            )}

            {error && (
              <div className="w-full max-w-[600px] bg-[rgba(196,75,48,0.08)] border border-[#a07840] rounded-[4px] px-3 py-2 text-[12px] italic text-[#8b0000] text-center">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 items-center mt-2">
              <button
                onClick={handleCast}
                disabled={!canCast}
                className={`font-cinzel text-[11px] tracking-[2px] uppercase px-8 py-2.5 rounded-[3px] border-[2px] transition-all duration-300 shadow-[2px_4px_12px_rgba(80,40,0,0.3)]
                  ${canCast
                    ? 'border-[#c9860b] text-[#f5e6c8] bg-[#4a1a00] cursor-pointer hover:brightness-110'
                    : 'border-[#a07840] text-[#5c3317] bg-[#c9a55a] cursor-not-allowed opacity-60'
                  } ${isLoading ? 'animate-pulse' : ''}`}
                style={canCast ? { textShadow: '0 0 8px rgba(255,200,50,0.6)' } : {}}
              >
                {isLoading ? 'Weaving ritual…' : '✦ Cast Ritual'}
              </button>
              <button
                onClick={handleClear}
                className="font-cinzel text-[9px] tracking-[1.5px] uppercase px-5 py-2.5 rounded-[3px] border-[2px] border-[#7a4f1a] text-[#2b1500] bg-[#c9a55a] cursor-pointer transition-all hover:bg-[#b8935a] shadow-[2px_4px_12px_rgba(80,40,0,0.3)]"
              >
                Clear Canvas
              </button>
            </div>

            {/* Save Button */}
            {spell && (
              <div className="mt-2">
                <SaveButton
                  spell={spell}
                  placedGlyphs={blueprint.shapes.reduce((acc, s) => ({ ...acc, ...s.placedGlyphs }), {})}
                  spellState={{
                    neatness: {
                      overall: blueprintState?.score?.overall ?? 0,
                    },
                    duration: blueprintState?.duration ?? null,
                  }}
                  blueprint={blueprint}
                />
              </div>
            )}
          </div>

          {/* COL 3 — Glyph Picker */}
          <div className="h-[520px]">
            <GlyphPicker
              selectedGlyph={selectedGlyph}
              onSelectGlyph={(id) => setSelectedGlyph(prev => prev === id ? null : id)}
              unlockedIds={unlockedIds}
            />
          </div>

          {/* COL 4 — Spell Card */}
          <div className="h-[520px] overflow-y-auto">
            <SpellCard
              spell={spell}
              duration={blueprintState?.duration ?? null}
              placedGlyphs={blueprint.shapes.reduce((acc, s) => ({ ...acc, ...s.placedGlyphs }), {})}
              isLoading={isLoading}
            />
          </div>

        </div>
      </div>

      {/* UNLOCK TOAST */}
      <UnlockToast
        unlock={activeUnlock}
        onDismiss={() => setActiveUnlock(null)}
      />

    </main>
  )
}
