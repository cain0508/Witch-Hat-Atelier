// ═══════════════════════════════════════════════
//  PAGE v2 — With glyph unlock system
// ═══════════════════════════════════════════════

'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import GlyphPicker    from '@/components/GlyphPicker'
import MagicCircle    from '@/components/MagicCircle'
import NeatnessMeter  from '@/components/NeatnessMeter'
import SpellCard      from '@/components/SpellCard'
import UnlockToast    from '@/components/UnlockToast'
import { getSpellState } from '@/lib/spellLogic'
import { loadUnlockedIds, saveUnlockedIds, checkForUnlock, getRank, getNextHint } from '@/lib/unlocks'
import { GLYPHS } from '@/lib/glyphs'
import SaveButton from '@/components/SaveButton'



export default function Home() {

  const [selectedGlyph, setSelectedGlyph] = useState(null)
  const [placedGlyphs,  setPlacedGlyphs]  = useState({})
  const [spellState,    setSpellState]     = useState(null)
  const [spell,         setSpell]          = useState(null)
  const [isLoading,     setIsLoading]      = useState(false)
  const [error,         setError]          = useState(null)
  const [hint,          setHint]           = useState('Select a sigil from the grimoire, then click a ring slot to place it.')

  // ── UNLOCK STATE ──
  const [unlockedIds,   setUnlockedIds]    = useState(() => {
  if (typeof window === 'undefined') return ['fire','water','wind','earth','light','shadow','time','duration','focus','spread','anchor']
  try {
    const raw = localStorage.getItem('wha_unlocked_glyphs')
    if (raw) return JSON.parse(raw)
    return ['fire','water','wind','earth','light','shadow','time','duration','focus','spread','anchor']
  } catch {
    return ['fire','water','wind','earth','light','shadow','time','duration','focus','spread','anchor']
  }
})
  const [activeUnlock,  setActiveUnlock]   = useState(null) // glyph being revealed

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
    setIsLoading(true)
    setSpell(null)
    setError(null)

    try {
      const res  = await fetch('/api/cast', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ placedGlyphs }),
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
  const rank    = getRank(unlockedIds.length)

  return (
    <main className="min-h-screen bg-[#0c0917] text-[#e8e0d0] relative overflow-x-hidden">

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none z-0"
           style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(45,27,105,0.55) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-[1100px] mx-auto px-4 py-5">

        {/* HEADER */}
        <header className="text-center mb-6 pb-5 border-b border-[rgba(201,168,76,0.18)]">
          
          <p className="font-cinzel text-[9px] tracking-[4px] text-[#c9a84c] opacity-70 uppercase mb-2">
            ✦ Fan Grimoire Project ✦
          </p>
          <h1 className="font-cinzel text-[28px] font-bold text-[#e8d090] leading-tight mb-1"
              style={{ textShadow: '0 0 30px rgba(201,168,76,0.2)' }}>
            Witch Hat Atelier
          </h1>
          <p className="font-cinzel text-[13px] text-[#c9a84c] mb-1">Sigil Forge</p>
          <p className="text-[13px] italic text-[#6b6080]"
             style={{ fontFamily: 'var(--font-im-fell, serif)' }}>
            Draw the glyphs. Weave the circle. Cast the spell.
          </p>

          {/* Rank badge */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="font-cinzel text-[8px] tracking-[2px] text-[#6b6080] uppercase">Rank</span>
            <span
              className="font-cinzel text-[10px] tracking-[1.5px] px-3 py-1 rounded-full border uppercase"
              style={{ color: rank.color, borderColor: `${rank.color}40`, background: `${rank.color}10` }}
            >
              {rank.title}
            </span>
            <span className="font-cinzel text-[8px] text-[#6b6080]" suppressHydrationWarning>
              {unlockedIds.length}/{GLYPHS.length} sigils
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 mt-3">
            <Link href="/grimoire"
              className="font-cinzel text-[10px] tracking-[1.5px] uppercase px-4 py-2 rounded-full border border-[rgba(201,168,76,0.25)] text-[#c9a84c] hover:bg-[rgba(201,168,76,0.08)] transition-all">
              The Grimoire →
            </Link>
            <Link href="/blueprint"
              className="font-cinzel text-[10px] tracking-[1.5px] uppercase px-4 py-2 rounded-full border border-[rgba(201,168,76,0.25)] text-[#c9a84c] hover:bg-[rgba(201,168,76,0.08)] transition-all">
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
            />
            <div className="w-full max-w-[360px]">
              <NeatnessMeter
                neatness={spellState?.neatness ?? null}
                duration={spellState?.duration ?? null}
              />
            </div>
            <p className="text-[12px] italic text-[#6b6080] text-center max-w-[320px] leading-relaxed"
               style={{ fontFamily: 'var(--font-im-fell, serif)' }}
               dangerouslySetInnerHTML={{ __html: hint }}
            />
            {error && (
              <div className="w-full max-w-[360px] bg-[rgba(196,75,48,0.08)] border border-[rgba(196,75,48,0.25)] rounded-lg px-3 py-2 text-[12px] italic text-[#e8a090]">
                {error}
              </div>
            )}
            <div className="flex gap-3 items-center">
              <button
                onClick={handleCast}
                disabled={!canCast}
                className={`font-cinzel text-[11px] tracking-[2px] uppercase px-7 py-2.5 rounded-full border transition-all duration-300
                  ${canCast
                    ? 'border-[#c9a84c] text-[#e8d090] bg-[rgba(201,168,76,0.07)] cursor-pointer hover:bg-[rgba(201,168,76,0.16)] hover:shadow-[0_0_20px_rgba(201,168,76,0.2)] hover:-translate-y-px'
                    : 'border-[#6b6080] text-[#6b6080] bg-transparent cursor-not-allowed opacity-40'
                  } ${isLoading ? 'animate-pulse' : ''}`}
              >
                {isLoading ? 'Weaving…' : '✦ Cast Spell'}
              </button>
              <button
                onClick={handleClear}
                className="font-cinzel text-[9px] tracking-[1.5px] uppercase px-4 py-2 rounded-full border border-[rgba(201,168,76,0.15)] text-[#6b6080] bg-transparent cursor-pointer transition-all hover:border-[rgba(196,75,48,0.4)] hover:text-[#e8a090]"
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
