// ═══════════════════════════════════════════════
//  SPELL CARD — Result display panel
//  Shows the spell name, rarity, element,
//  duration, lore text, and glyphs used.
//  Lore text types in character by character.
// ═══════════════════════════════════════════════

'use client'

import { useEffect, useState } from 'react'
import { GLYPHS } from '@/lib/glyphs'

// Element color map
const ELEMENT_COLORS = {
  fire:     '#e8593c',
  water:    '#3b8bd4',
  wind:     '#5cb85c',
  earth:    '#a0783c',
  light:    '#c9a84c',
  shadow:   '#9b59b6',
  time:     '#4ecdc4',
  unknown:  '#6b6080',
}

// Rarity styles
const RARITY_STYLES = {
  common:   { bg: 'rgba(160,154,184,0.1)',  border: 'rgba(160,154,184,0.25)', text: '#a09ab8' },
  rare:     { bg: 'rgba(78,205,196,0.1)',   border: 'rgba(78,205,196,0.35)',  text: '#4ecdc4' },
  legendary:{ bg: 'rgba(201,168,76,0.12)',  border: 'rgba(201,168,76,0.4)',   text: '#c9a84c' },
  unstable: { bg: 'rgba(196,75,48,0.1)',    border: 'rgba(196,75,48,0.35)',   text: '#e8593c' },
}

export default function SpellCard({ spell, duration, placedGlyphs, isLoading }) {

  const [displayedLore, setDisplayedLore] = useState('')
  const [isTyping, setIsTyping]           = useState(false)

  // Typewriter effect on lore text when spell changes
  useEffect(() => {
    if (!spell?.lore) { setDisplayedLore(''); return }

    setDisplayedLore('')
    setIsTyping(true)

    let i = 0
    const interval = setInterval(() => {
      i += 2
      setDisplayedLore(spell.lore.substring(0, i))
      if (i >= spell.lore.length) {
        setDisplayedLore(spell.lore)
        setIsTyping(false)
        clearInterval(interval)
      }
    }, 16)

    return () => clearInterval(interval)
  }, [spell?.spell_name])

  // ── EMPTY STATE ──
  if (!spell && !isLoading) {
    return (
      <div className="flex flex-col h-full bg-[#0e0a1a] border border-[rgba(201,168,76,0.22)] rounded-xl overflow-hidden">
        <PanelHeader />
        <div className="flex flex-col items-center justify-center flex-1 p-6 text-center opacity-50">
          <div className="text-3xl mb-3 opacity-30">◎</div>
          <p className="text-[13px] italic text-[#6b6080] leading-relaxed"
             style={{ fontFamily: 'var(--font-im-fell, serif)' }}>
            Place glyphs into the circle and cast to unveil the spell within.
          </p>
        </div>
      </div>
    )
  }

  // ── LOADING STATE ──
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-[#0e0a1a] border border-[rgba(201,168,76,0.22)]
                      rounded-xl overflow-hidden">
        <PanelHeader />
        <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[rgba(201,168,76,0.2)]
                          border-t-[#c9a84c] animate-spin mb-4" />
          <p className="text-[13px] italic text-[#6b6080] leading-relaxed"
             style={{ fontFamily: 'var(--font-im-fell, serif)' }}>
            The ink stirs… the circle awakens…
          </p>
        </div>
      </div>
    )
  }

  // ── SPELL RESULT ──
  const rarityStyle   = RARITY_STYLES[spell.rarity] ?? RARITY_STYLES.common
  const elementColor  = ELEMENT_COLORS[spell.element] ?? ELEMENT_COLORS.unknown

  // Glyphs used — get objects from placed glyph ids
const glyphsUsed = Object.entries(placedGlyphs ?? {})
  .map(([slotId, id]) => ({ ...GLYPHS.find(g => g.id === id), slotId }))
  .filter(g => g.id)

  return (
    <div className="flex flex-col h-full bg-[#0e0a1a] border border-[rgba(201,168,76,0.22)]
                    rounded-xl overflow-hidden">
      <PanelHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {/* Rarity badge */}
        <span
          className="inline-block font-cinzel text-[8px] tracking-[2px] uppercase
                     px-2.5 py-1 rounded-lg border"
          style={{
            background:  rarityStyle.bg,
            borderColor: rarityStyle.border,
            color:       rarityStyle.text,
          }}
        >
          {spell.rarity?.toUpperCase()}
        </span>

        {/* Spell name */}
        <h2 className="font-cinzel text-[18px] font-bold text-[#e8d090] leading-tight">
          {spell.spell_name}
        </h2>

        {/* Element tag */}
        <p
          className="font-cinzel text-[8px] tracking-[2px] uppercase"
          style={{ color: elementColor }}
        >
          ✦ {spell.element?.toUpperCase()} WORKING
        </p>

        {/* Duration row */}
        {duration && (
          <div className="flex items-center gap-2">
            <span className="font-cinzel text-[8px] tracking-[1.5px] text-[#6b6080] uppercase">
              Duration
            </span>
            <div className="flex gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-sm border"
                  style={{
                    background:  i < duration.pips ? `${duration.color}30` : 'rgba(255,255,255,0.03)',
                    borderColor: i < duration.pips ? duration.color         : 'rgba(201,168,76,0.12)',
                  }}
                />
              ))}
            </div>
            <span
              className="font-cinzel text-[8px]"
              style={{ color: duration.color }}
            >
              {duration.label}
            </span>
          </div>
        )}

        {/* Duration note */}
        {spell.duration_note && (
          <p className="text-[11px] italic text-[#6b6080] pl-3
                        border-l-2 border-[rgba(201,168,76,0.15)] leading-relaxed"
             style={{ fontFamily: 'var(--font-im-fell, serif)' }}>
            {spell.duration_note}
          </p>
        )}

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(201,168,76,0.2)] to-transparent" />

        {/* Lore text with typewriter */}
        <p
          className="text-[13.5px] italic text-[#e8e0d0] leading-[1.8]"
          style={{ fontFamily: 'var(--font-im-fell, serif)' }}
        >
          {displayedLore}
          {isTyping && (
            <span className="animate-pulse text-[#c9a84c]">|</span>
          )}
        </p>

        {/* Glyphs used */}
        <div className="pt-1 border-t border-[rgba(201,168,76,0.08)]">
          <p className="font-cinzel text-[8px] tracking-[2px] text-[#6b6080] uppercase mb-2">
            Glyphs Used
          </p>
          <div className="flex flex-wrap gap-1.5">
            {glyphsUsed.map(glyph => (
              <span
                key={glyph.slotId}
                className="font-cinzel text-[8px] tracking-[0.5px] px-2 py-1
                           rounded-lg border"
                style={{
                  color:       glyph.color,
                  borderColor: `${glyph.color}40`,
                  background:  `${glyph.color}08`,
                }}
              >
                {glyph.name}
              </span>
            ))}
          </div>
        </div>

        {/* Neatness note */}
        <div className="bg-[rgba(45,27,105,0.15)] border border-[rgba(201,168,76,0.08)]
                        rounded-lg px-3 py-2">
          <p className="font-cinzel text-[8px] tracking-[1.5px] text-[#6b6080] uppercase mb-1">
            Neatness Score
          </p>
          <p className="font-cinzel text-[11px] text-[#c9a84c]">
            {spell.rarity === 'legendary' ? 'Exceptional penmanship — this circle will be studied.' :
             spell.rarity === 'rare'      ? 'Careful work — the lines held true.' :
             spell.rarity === 'unstable'  ? 'Conflicting elements tore the circle apart.' :
                                            'Passable — room to improve the linework.'}
          </p>
        </div>

      </div>
    </div>
  )
}

// ── PANEL HEADER ─────────────────────────────────
function PanelHeader() {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[rgba(201,168,76,0.1)]">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 1L7.5 4.5H11L8 7L9 11L6 8.5L3 11L4 7L1 4.5H4.5L6 1Z"
              stroke="#c9a84c" strokeWidth="1" fill="none"/>
      </svg>
      <span className="font-cinzel text-[10px] tracking-[2px] text-[#c9a84c] uppercase">
        Spell Manifest
      </span>
    </div>
  )
}
