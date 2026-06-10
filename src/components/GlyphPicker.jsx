'use client'

import { GLYPHS, GLYPH_TYPES } from '@/lib/glyphs'
import WaxSeal from './WaxSeal'

export default function GlyphPicker({ selectedGlyph, onSelectGlyph, unlockedIds = [] }) {

  const primaryGlyphs = GLYPHS.filter(g => g.type === GLYPH_TYPES.PRIMARY)
  const modifierGlyphs = GLYPHS.filter(g => g.type === GLYPH_TYPES.MODIFIER)

  // A glyph is locked only if unlocked:false AND not yet discovered
  function isGlyphLocked(glyph) {
    if (glyph.unlocked === true) return false
    return !unlockedIds.includes(glyph.id)
  }

  function handleSelect(glyph) {
    if (isGlyphLocked(glyph)) return
    onSelectGlyph(glyph.id)
  }

  return (
    <div className="flex flex-col h-full border border-[#a07840] rounded-[4px] overflow-hidden shadow-[2px_4px_12px_rgba(80,40,0,0.3)]" style={{ background: 'linear-gradient(135deg, #e8d5a3, #d4b483)' }}>

      {/* Panel header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b-[3px] border-double border-[#a07840]">
        <span className="font-cinzel text-[10px] tracking-[2px] text-[#7a3e00] uppercase">
          Sigil Grimoire
        </span>
      </div>

      {/* Scrollable glyph list */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">

        {/* Element glyphs */}
        <div>
          <p className="font-cinzel text-[10px] tracking-[2px] text-[#a07840] uppercase pb-1 mb-2 text-center">
            ── Elements ──
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {primaryGlyphs.map(glyph => {
              const locked = isGlyphLocked(glyph)
              return (
                <GlyphCard
                  key={glyph.id}
                  glyph={glyph}
                  isSelected={selectedGlyph === glyph.id}
                  isLocked={locked}
                  onSelect={() => handleSelect(glyph)}
                />
              )
            })}
          </div>
        </div>

        {/* Modifier glyphs */}
        <div>
          <p className="font-cinzel text-[10px] tracking-[2px] text-[#a07840] uppercase pb-1 mb-2 text-center">
            ── Modifiers ──
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {modifierGlyphs.map(glyph => {
              const locked = isGlyphLocked(glyph)
              return (
                <GlyphCard
                  key={glyph.id}
                  glyph={glyph}
                  isSelected={selectedGlyph === glyph.id}
                  isLocked={locked}
                  onSelect={() => handleSelect(glyph)}
                />
              )
            })}
          </div>
        </div>

      </div>

      {/* Selected glyph info footer */}
      {selectedGlyph && <SelectedGlyphInfo glyphId={selectedGlyph} />}

    </div>
  )
}

// ── GLYPH CARD ────────────────────────────────────

function GlyphCard({ glyph, isSelected, isLocked, onSelect }) {
  return (
    <button
      onClick={onSelect}
      title={isLocked ? 'Not yet discovered' : glyph.effect}
      className={`
        flex flex-col items-center gap-1.5 w-full pt-1 pb-2
        transition-all duration-200 text-center select-none group
        ${isLocked ? 'cursor-not-allowed opacity-50 grayscale' : 'cursor-pointer'}
        ${isSelected ? 'scale-110' : 'hover:scale-105'}
      `}
    >
      <WaxSeal
        color={glyph.color}
        iconSvg={glyph.svg}
        isLocked={isLocked}
        size={56}
        glowColor={isSelected ? glyph.color : null}
        className={isSelected ? 'z-10' : ''}
      />
      <span className="font-cinzel text-[10px] text-[#3b1f0a] font-bold uppercase tracking-wide mt-0.5">
        {isLocked ? '???' : glyph.name}
      </span>
    </button>
  )
}

// ── SELECTED GLYPH INFO ───────────────────────────

function SelectedGlyphInfo({ glyphId }) {
  const glyph = GLYPHS.find(g => g.id === glyphId)
  if (!glyph) return null

  return (
    <div className="px-3 py-2.5 border-t-[3px] border-double border-[#a07840]" style={{ background: 'linear-gradient(135deg, #d4b483, #c9a55a)' }}>
      <p className="font-cinzel text-[10px] tracking-[1.5px] text-[#7a3e00] uppercase mb-1">
        {glyph.name}
      </p>
      <p className="text-[11px] italic text-[#3b1f0a] leading-snug">
        {glyph.effect}
      </p>
    </div>
  )
}