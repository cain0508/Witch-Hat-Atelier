// ═══════════════════════════════════════════════
//  PAGE v2 — With glyph unlock system
// ═══════════════════════════════════════════════

'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import GlyphPicker from '@/components/GlyphPicker'
import MagicCircle from '@/components/MagicCircle'
import NeatnessMeter from '@/components/NeatnessMeter'
import SpellCard from '@/components/SpellCard'
import UnlockToast from '@/components/UnlockToast'
import { getSpellState } from '@/lib/spellLogic'
import { loadUnlockedIds, saveUnlockedIds, checkForUnlock, getRank, getNextHint } from '@/lib/unlocks'
import { GLYPHS } from '@/lib/glyphs'
import SaveButton from '@/components/SaveButton'



export default function Home() {

  const [selectedGlyph, setSelectedGlyph] = useState(null)
  const [placedGlyphs, setPlacedGlyphs] = useState({})
  const [spellState, setSpellState] = useState(null)
  const [spell, setSpell] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hint, setHint] = useState('Select a sigil from the grimoire, then click a ring slot to place it.')
  const [triggerCastAnim, setTriggerCastAnim] = useState(false)

  // ── UNLOCK STATE ──
  const [unlockedIds, setUnlockedIds] = useState(() => {
    if (typeof window === 'undefined') return ['fire', 'water', 'wind', 'earth', 'light', 'shadow', 'time', 'duration', 'focus', 'spread', 'anchor']
    try {
      const raw = localStorage.getItem('wha_unlocked_glyphs')
      if (raw) return JSON.parse(raw)
      return ['fire', 'water', 'wind', 'earth', 'light', 'shadow', 'time', 'duration', 'focus', 'spread', 'anchor']
    } catch {
      return ['fire', 'water', 'wind', 'earth', 'light', 'shadow', 'time', 'duration', 'focus', 'spread', 'anchor']
    }
  })
  const [activeUnlock, setActiveUnlock] = useState(null) // glyph being revealed

  // Load unlocked ids from localStorage on mountdel
  // Recompute spell state on every glyph change
  useEffect(() => {
    const state = getSpellState(placedGlyphs)
    setSpellState(state)
    updateHint(state, placedGlyphs)
  }, [placedGlyphs])

  // ── HINT TEXT ──
  function updateHint(state, placed) {
    if (!placed['c0']) {
      const nextHint = getNextHint(unlockedIds)
      if (nextHint) {
        setHint(`<em style="color:rgba(201,168,76,0.6)">${nextHint}</em>`)
      } else {
        setHint('Select a sigil from the grimoire, then click a ring slot to place it.')
      }
      return
    }
    if (state.isUnstable) {
      setHint('Conflicting elements detected — the circle is unstable.')
      return
    }
    if (state.neatness?.overall >= 85) {
      setHint('Exceptional circle — this working will produce a lasting spell.')
      return
    }
    if (state.totalPlaced === 1) {
      setHint('Center glyph placed. Add modifiers to shape the spell, or cast now.')
      return
    }
    setHint(`${state.totalPlaced} glyphs placed. Cast when ready.`)
  }

  // ── PLACE GLYPH ──
  function handlePlaceGlyph(slotId) {
    if (!selectedGlyph) return
    const glyph = GLYPHS.find(g => g.id === selectedGlyph)
    if (slotId === 'c0' && glyph?.type !== 'primary') {
      setHint('Only element glyphs can anchor the center slot.')
      return
    }
    setPlacedGlyphs(prev => ({ ...prev, [slotId]: selectedGlyph }))
  }

  function handleSelectGlyph(glyphId) {
    setSelectedGlyph(prev => prev === glyphId ? null : glyphId)
  }

  function handleClear() {
    setPlacedGlyphs({})
    setSelectedGlyph(null)
    setSpell(null)
    setError(null)
    setHint('Select a sigil from the grimoire, then click a ring slot to place it.')
  }

  // ── CAST SPELL ──
  async function handleCast() {
    if (!placedGlyphs['c0'] || isLoading) return
    
    setTriggerCastAnim(true)
    setTimeout(() => setTriggerCastAnim(false), 50)
    
    setIsLoading(true)
    setSpell(null)
    setError(null)

    try {
      const res = await fetch('/api/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placedGlyphs }),
      })
      const data = await res.json()

      if (data.success) {
        setSpell(data.spell)

        // ── Local Storage Statistics Updates for Shape Unlocks ──
        const placedIdsList = Object.values(placedGlyphs)
        const isFireWaterUnstable = data.spell.rarity === 'unstable' && placedIdsList.includes('fire') && placedIdsList.includes('water')

        const currentSpells = parseInt(localStorage.getItem('wha_spells_cast_count') || '0', 10)
        localStorage.setItem('wha_spells_cast_count', (currentSpells + 1).toString())

        if (data.spell.rarity === 'legendary') {
          const currentLegendary = parseInt(localStorage.getItem('wha_legendary_cast_count') || '0', 10)
          localStorage.setItem('wha_legendary_cast_count', (currentLegendary + 1).toString())
        }

        if (isFireWaterUnstable) {
          localStorage.setItem('wha_cast_fire_water_unstable', 'true')
        }

        // ── Check for unlock AFTER successful cast ──
        const unlock = checkForUnlock(placedGlyphs, unlockedIds)
        if (unlock) {
          // Small delay so spell card appears first
          setTimeout(() => {
            setActiveUnlock(unlock)
            const newIds = [...unlockedIds, unlock.glyph.id]
            setUnlockedIds(newIds)
            saveUnlockedIds(newIds)
          }, 1200)
        }
      } else {
        setError(data.error ?? 'The circle could not be read.')
        setSpell(data.spell ?? null)
      }

    } catch (err) {
      setError('The connection was lost. Check your network and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Dismiss unlock toast
  function handleDismissUnlock() {
    setActiveUnlock(null)
  }

  const canCast = spellState?.canCast && !isLoading
  const rank = getRank(unlockedIds.length)

  return (
    <main className="min-h-screen bg-[#d4b483] text-[#3b1f0a] relative overflow-x-hidden">

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,165,90,0.15) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-[1100px] mx-auto px-4 py-5">

        {/* HEADER */}
        <header className="text-center mb-6 pb-5 border-b-[3px] border-double border-[#a07840]">

          <p className="font-cinzel text-[9px] tracking-[4px] text-[#a07840] uppercase mb-2">
            ✦ Fan Grimoire Project ✦
          </p>
          <h1 className="font-cinzel text-[28px] font-bold text-[#3b1f0a] leading-tight mb-1"
            style={{ textShadow: '0 1px 0 rgba(255,220,150,0.4)' }}>
            Witch Hat Atelier
          </h1>
          <p className="font-cinzel text-[13px] text-[#3b1f0a] mb-1">Sigil Forge</p>
          <p className="text-[13px] italic text-[#7a4f1a]"
            style={{ fontFamily: 'var(--font-im-fell, serif)' }}>
            Draw the glyphs. Weave the circle. Cast the spell.
          </p>

          {/* Rank badge */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="font-cinzel text-[8px] tracking-[2px] text-[#5c3317] uppercase">Rank</span>
            <span
              className="font-cinzel text-[10px] tracking-[1.5px] px-3 py-1 rounded-[3px] border uppercase"
              style={{ color: '#f5e6c8', borderColor: '#c9860b', background: '#4a1a00' }}
            >
              {rank.title}
            </span>
            <span className="font-cinzel text-[8px] text-[#5c3317]" suppressHydrationWarning>
              {unlockedIds.length}/{GLYPHS.length} sigils
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 mt-3">
            <Link href="/grimoire"
              className="font-cinzel text-[10px] tracking-[1.5px] uppercase px-4 py-2 rounded-[3px] border-[2px] border-[#7a4f1a] bg-[#c9a55a] text-[#2b1500] hover:bg-[#b8935a] transition-all shadow-[2px_4px_12px_rgba(80,40,0,0.3)]">
              The Grimoire →
            </Link>
            <Link href="/blueprint"
              className="font-cinzel text-[10px] tracking-[1.5px] uppercase px-4 py-2 rounded-[3px] border-[2px] border-[#7a4f1a] bg-[#c9a55a] text-[#2b1500] hover:bg-[#b8935a] transition-all shadow-[2px_4px_12px_rgba(80,40,0,0.3)]">
              Blueprint Forge →
            </Link>
          </div>
        </header>

        {/* THREE COLUMN LAYOUT */}
        <div className="grid grid-cols-[200px_1fr_250px] gap-4 items-start">

          {/* LEFT — Glyph Picker */}
          <GlyphPicker
            selectedGlyph={selectedGlyph}
            onSelectGlyph={handleSelectGlyph}
            unlockedIds={unlockedIds}
          />

          {/* CENTER */}
          <div className="flex flex-col items-center gap-4">
            <MagicCircle
              placedGlyphs={placedGlyphs}
              selectedGlyph={selectedGlyph}
              onPlaceGlyph={handlePlaceGlyph}
              neatness={spellState?.neatness ?? null}
              triggerCastAnim={triggerCastAnim}
            />
            <div className="w-full max-w-[360px]">
              <NeatnessMeter
                neatness={spellState?.neatness ?? null}
                duration={spellState?.duration ?? null}
              />
            </div>
            <p className="text-[12px] italic text-[#3b1f0a] text-center max-w-[320px] leading-relaxed"
              style={{ fontFamily: 'var(--font-im-fell, serif)' }}
              dangerouslySetInnerHTML={{ __html: hint }}
            />
            {error && (
              <div className="w-full max-w-[360px] bg-[rgba(196,75,48,0.08)] border border-[#a07840] rounded-[4px] px-3 py-2 text-[12px] italic text-[#8b0000]">
                {error}
              </div>
            )}
            <div className="flex gap-3 items-center">
              <button
                onClick={handleCast}
                disabled={!canCast}
                className={`font-cinzel text-[13px] tracking-[0.15em] uppercase px-7 py-2.5 rounded-[3px] border-[2px] transition-all duration-300
                  ${canCast
                    ? 'border-[#c9860b] text-[#f5e6c8] cursor-pointer shadow-[0_0_14px_rgba(180,140,60,0.35)] hover:shadow-[0_0_20px_rgba(200,160,40,0.6)] hover:border-[#f0c040]'
                    : 'border-[#a07840] text-[#5c3317] bg-[#c9a55a] cursor-not-allowed opacity-60'
                  } ${isLoading ? 'animate-pulse' : ''}`}
                style={canCast ? { background: 'linear-gradient(135deg, #4a1a00, #2b0f00)', textShadow: '0 0 8px rgba(255,200,50,0.4)' } : {}}
              >
                {isLoading ? 'Weaving…' : '✦ Cast Spell'}
              </button>
              <button
                onClick={handleClear}
                className="font-cinzel text-[9px] tracking-[1.5px] uppercase px-4 py-2 rounded-[3px] border-[2px] border-[#7a4f1a] text-[#2b1500] bg-[#c9a55a] cursor-pointer transition-all hover:bg-[#b8935a] shadow-[2px_4px_12px_rgba(80,40,0,0.3)]"
              >
                Clear
              </button>
            </div>
            <SaveButton
              spell={spell}
              placedGlyphs={placedGlyphs}
              spellState={spellState}
            />
          </div>

          {/* RIGHT — Spell Card */}
          <SpellCard
            spell={spell}
            duration={spellState?.duration ?? null}
            placedGlyphs={placedGlyphs}
            isLoading={isLoading}
          />

        </div>
      </div>

      {/* UNLOCK TOAST */}
      <UnlockToast
        unlock={activeUnlock}
        onDismiss={handleDismissUnlock}
      />

    </main>
  )
}
