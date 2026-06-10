// ═══════════════════════════════════════════════
//  SPELL CARD — Result display panel
//  Shows the spell name, rarity, element,
//  duration, lore text, and glyphs used.
//  Lore text types in character by character.
// ═══════════════════════════════════════════════

'use client'

import { useEffect, useState } from 'react'
import { GLYPHS } from '@/lib/glyphs'
import { neatnessColor, neatnessLabel } from '@/lib/spellLogic'
import WaxSeal from './WaxSeal'

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
  common:   { bg: '#c9a55a',  border: '#a07840', text: '#3b1f0a' },
  rare:     { bg: '#b8935a',   border: '#8b5a2b',  text: '#2b1500' },
  legendary:{ bg: '#8b1a1a',  border: '#5a0a0a',   text: '#f5e6c8' },
  unstable: { bg: '#4a1a00',    border: '#c9860b',   text: '#f5e6c8' },
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
    <div className="flex flex-col border border-[#a07840] rounded-[4px] overflow-hidden shadow-[2px_4px_12px_rgba(80,40,0,0.3)] w-full max-w-sm relative" style={{ background: 'linear-gradient(135deg, #e8d5a3, #d4b483)' }}>
      
      {/* Top decoration */}
      <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#7a3e00] to-transparent opacity-60" />
      
      <div className="p-5 flex flex-col items-center text-center">
        
        {/* Decorative icon */}
        <div className="mb-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12,2 L15,9 L22,12 L15,15 L12,22 L9,15 L2,12 L9,9 Z" fill="rgba(122,62,0,0.1)" stroke="#7a3e00" strokeWidth="1"/>
            <circle cx="12" cy="12" r="3" fill="#5c3317"/>
          </svg>
        </div>

        <h3 className="font-cinzel text-[22px] font-bold text-[#3b1f0a] mb-1 leading-tight" style={{ textShadow: '0 1px 0 rgba(255,220,150,0.4)' }}>
          Unbound Circle
        </h3>

        <p className="font-cinzel text-[10px] tracking-[3px] text-[#7a4f1a] uppercase mb-4 opacity-90">
          Awaiting Transcription
        </p>

        {/* Divider */}
        <div className="w-16 h-[3px] border-t border-b border-[#a07840] mb-4" />

        <p className="text-[14px] text-[#2b1500] leading-relaxed mb-5 italic" style={{ fontFamily: 'var(--font-im-fell, serif)' }}>
          "Place glyphs into the circle and cast to unveil the spell within."
        </p>
      </div>
    </div>
    )
  }

  // ── LOADING STATE ──
  if (isLoading) {
    return (
      <div className="flex flex-col border border-[#a07840] rounded-[4px] overflow-hidden shadow-[2px_4px_12px_rgba(80,40,0,0.3)] w-full max-w-sm h-full relative" style={{ background: 'linear-gradient(135deg, #e8d5a3, #d4b483)' }}>
        <PanelHeader />
        <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
          <div className="w-8 h-8 rounded-full border-[3px] border-[#a07840] border-t-[#3b1f0a] animate-spin mb-4" />
          <p className="text-[14px] italic text-[#2b1500] leading-relaxed"
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

  const uniqueGlyphs = Array.from(new Map(glyphsUsed.map(g => [g.id, g])).values());

  return (
    <div className="flex flex-col border border-[#a07840] rounded-[4px] overflow-hidden shadow-[2px_4px_12px_rgba(80,40,0,0.3)] w-full max-w-sm h-full relative" style={{ background: 'linear-gradient(135deg, #e8d5a3, #d4b483)' }}>
      <PanelHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {/* Rarity badge */}
        <span
          className="inline-block font-cinzel text-[9px] tracking-[2px] uppercase px-3 py-1 rounded-[3px] border"
          style={{
            background:  rarityStyle.bg,
            borderColor: rarityStyle.border,
            color:       rarityStyle.text,
          }}
        >
          {spell.rarity?.toUpperCase()}
        </span>

        {/* Spell name */}
        <h2 className="font-cinzel text-[20px] font-bold text-[#3b1f0a] leading-tight" style={{ textShadow: '0 1px 0 rgba(255,220,150,0.4)' }}>
          {spell.spell_name}
        </h2>

        {/* Element tag */}
        <p
          className="font-cinzel text-[10px] tracking-[2px] uppercase"
          style={{ color: elementColor }}
        >
          ✦ {spell.element?.toUpperCase()} WORKING
        </p>

        {/* Duration row */}
        {duration && (
          <div className="flex items-center gap-3">
            <span className="font-cinzel text-[11px] font-bold tracking-[2px] text-[#3b1f0a] uppercase mt-0.5">
              Duration:
            </span>
            <div className="flex gap-0 bg-[#4a2a10] p-1 rounded-full border border-[#2a160d] shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)]">
              {Array.from({ length: 8 }).map((_, i) => {
                const isFilled = i < duration.pips;
                return (
                  <div 
                    key={i} 
                    className="w-[22px] h-[22px] rounded-full relative flex items-center justify-center -ml-1 first:ml-0"
                    style={{
                      background: isFilled 
                        ? 'radial-gradient(circle at 30% 30%, #ffd700 0%, #daa520 60%, #b8860b 100%)' 
                        : 'radial-gradient(circle at 30% 30%, #5a3a20 0%, #3a2010 60%, #1a0a05 100%)',
                      border: '1px solid #1a0a05',
                      boxShadow: isFilled 
                        ? 'inset 0 1px 2px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.6)' 
                        : 'inset 0 1px 2px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.4)',
                      zIndex: 8 - i
                    }}
                  >
                    {/* Inner embossed dot or pattern */}
                    <div 
                      className="absolute inset-[3px] rounded-full border"
                      style={{
                        borderColor: isFilled ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.6)',
                        borderStyle: 'dashed'
                      }}
                    />
                    {isFilled && (
                       <div className="w-2 h-2 rounded-full bg-[#fce38a] opacity-80" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

            <div className="flex flex-col gap-4 items-center px-4 mt-6">
              <div className="flex flex-col items-center border-t border-[#a07840]/30 w-full pt-4">
                <span className="font-cinzel text-[11px] font-bold tracking-[2px] text-[#3b1f0a] uppercase mb-3">
                  Used Glyphs
                </span>
                <div className="flex flex-wrap gap-2 justify-center max-w-[250px]">
                  {uniqueGlyphs.map((glyph, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <WaxSeal
                        color={glyph.color}
                        iconSvg={glyph.svg}
                        size={48}
                        className="drop-shadow-sm"
                      />
                      <span className="font-cinzel text-[9px] font-bold text-[#3b1f0a] tracking-[1px] uppercase mt-0.5">
                        {glyph.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

        {/* Duration note */}
        {spell.duration_note && (
          <p className="text-[12px] italic text-[#3b1f0a] pl-3
                        border-l-2 border-[#a07840] leading-relaxed"
             style={{ fontFamily: 'var(--font-im-fell, serif)' }}>
            {spell.duration_note}
          </p>
        )}

        {/* Divider */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#7a3e00] to-transparent opacity-40" />

        {/* Lore text with typewriter */}
        <p
          className="text-[14px] italic text-[#2b1500] leading-[1.8]"
          style={{ fontFamily: 'var(--font-im-fell, serif)' }}
        >
          {displayedLore}
          {isTyping && (
            <span className="animate-pulse text-[#b8860b]">|</span>
          )}
        </p>



        {/* Neatness note */}
        <div className="bg-[rgba(255,255,255,0.15)] border border-[#a07840] rounded-[4px] px-3 py-2">
          <p className="font-cinzel text-[9px] tracking-[1.5px] text-[#7a4f1a] uppercase mb-1">
            Neatness Score
          </p>
          <p className="font-cinzel text-[11px] text-[#5c3317]">
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
    <div className="flex items-center gap-2 px-3 py-2.5 border-b-[3px] border-double border-[#a07840]">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 1L7.5 4.5H11L8 7L9 11L6 8.5L3 11L4 7L1 4.5H4.5L6 1Z"
              stroke="#7a3e00" strokeWidth="1" fill="none"/>
      </svg>
      <span className="font-cinzel text-[10px] tracking-[2px] text-[#7a3e00] uppercase">
        Spell Manifest
      </span>
    </div>
  )
}
