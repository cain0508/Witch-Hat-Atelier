'use client'

import { GLYPHS, GLYPH_TYPES } from '@/lib/glyphs'

export default function GlyphPicker({ selectedGlyph, onSelectGlyph, unlockedIds = [] }) {

  const primaryGlyphs  = GLYPHS.filter(g => g.type === GLYPH_TYPES.PRIMARY)
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
    <div className="flex flex-col h-full bg-[#0e0a1a] border border-[rgba(201,168,76,0.22)] rounded-xl overflow-hidden">

      {/* Panel header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[rgba(201,168,76,0.1)]">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="#c9a84c" strokeWidth="1"/>
          <circle cx="6" cy="6" r="2" fill="#c9a84c" opacity="0.5"/>
        </svg>
        <span className="font-cinzel text-[10px] tracking-[2px] text-[#c9a84c] uppercase">
          Sigil Grimoire
        </span>
      </div>

      {/* Scrollable glyph list */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">

        {/* Element glyphs */}
        <div>
          <p className="font-cinzel text-[8px] tracking-[2px] text-[#6b6080] uppercase pb-1.5 mb-2 border-b border-[rgba(201,168,76,0.08)]">
            Elements
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
          <p className="font-cinzel text-[8px] tracking-[2px] text-[#6b6080] uppercase pb-1.5 mb-2 border-b border-[rgba(201,168,76,0.08)]">
            Modifiers
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
        flex flex-col items-center p-2 rounded-lg border
        transition-all duration-200 text-center select-none
        ${isLocked
          ? 'border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] cursor-not-allowed opacity-40 grayscale'
          : isSelected
            ? 'border-[#c9a84c] bg-[rgba(201,168,76,0.12)] shadow-[0_0_12px_rgba(201,168,76,0.2)] cursor-pointer'
            : 'border-[rgba(201,168,76,0.15)] bg-[rgba(45,27,105,0.1)] hover:border-[#c9a84c] hover:bg-[rgba(45,27,105,0.28)] hover:-translate-y-px cursor-pointer'
        }
      `}
    >
      {isLocked ? (
        <>
          <div className="w-8 h-8 mb-1 flex items-center justify-center text-[18px] opacity-30">?</div>
          <span className="font-cinzel text-[8.5px] text-[#6b6080]">???</span>
        </>
      ) : (
        <>
          <div className="w-8 h-8 mb-1" dangerouslySetInnerHTML={{ __html: glyph.svg }}/>
          <span className="font-cinzel text-[8.5px] text-[#e8d090] leading-tight">{glyph.name}</span>
        </>
      )}
      <div className="w-1 h-1 rounded-full mt-1" style={{ background: isLocked ? '#6b6080' : glyph.color }}/>
    </button>
  )
}

// ── SELECTED GLYPH INFO ───────────────────────────

function SelectedGlyphInfo({ glyphId }) {
  const glyph = GLYPHS.find(g => g.id === glyphId)
  if (!glyph) return null

  return (
    <div className="px-3 py-2.5 border-t border-[rgba(201,168,76,0.1)] bg-[rgba(45,27,105,0.15)]">
      <p className="font-cinzel text-[8px] tracking-[1.5px] text-[#c9a84c] uppercase mb-1">
        {glyph.name}
      </p>
      <p className="text-[11px] italic text-[#6b6080] leading-snug">
        {glyph.effect}
      </p>
    </div>
  )
}