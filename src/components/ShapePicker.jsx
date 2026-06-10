// ═══════════════════════════════════════════════
//  SHAPE PICKER — Select blueprint shape
//  Shows all unlocked shapes grouped by tier.
//  User clicks a shape to add it to the blueprint.
// ═══════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { SHAPES, SHAPE_TIERS, getUnlockedShapes } from '@/lib/shapes'
import WaxSeal from './WaxSeal'

const TIER_ORDER = [
  SHAPE_TIERS.BASE,
  SHAPE_TIERS.BASIC,
  SHAPE_TIERS.ADVANCED,
  SHAPE_TIERS.MASTER,
  SHAPE_TIERS.SPECIAL,
  SHAPE_TIERS.RARE,
]

const TIER_LABELS = {
  base: 'Foundation',
  basic: 'Basic',
  advanced: 'Advanced',
  master: 'Master',
  special: 'Special',
  rare: 'Rare',
}

// SVG previews for each shape
const SHAPE_SVGS = {
  circle: `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="30" r="22" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 4"/><circle cx="30" cy="30" r="4" fill="currentColor" opacity=".5"/></svg>`,
  triangle: `<svg viewBox="0 0 60 60" fill="none"><polygon points="30,8 54,50 6,50" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="30" cy="30" r="3" fill="currentColor" opacity=".5"/></svg>`,
  pentagon: `<svg viewBox="0 0 60 60" fill="none"><polygon points="30,6 56,24 46,52 14,52 4,24" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="30" cy="32" r="3" fill="currentColor" opacity=".5"/></svg>`,
  hexagon: `<svg viewBox="0 0 60 60" fill="none"><polygon points="30,6 52,18 52,42 30,54 8,42 8,18" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`,
  trispell: `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="18" r="13" stroke="currentColor" stroke-width="1" fill="none" opacity=".8"/><circle cx="19" cy="38" r="13" stroke="currentColor" stroke-width="1" fill="none" opacity=".8"/><circle cx="41" cy="38" r="13" stroke="currentColor" stroke-width="1" fill="none" opacity=".8"/></svg>`,
  square: `<svg viewBox="0 0 60 60" fill="none"><rect x="10" y="10" width="40" height="40" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="10" cy="10" r="2.5" fill="currentColor" opacity=".6"/><circle cx="50" cy="10" r="2.5" fill="currentColor" opacity=".6"/><circle cx="50" cy="50" r="2.5" fill="currentColor" opacity=".6"/><circle cx="10" cy="50" r="2.5" fill="currentColor" opacity=".6"/></svg>`,
  star: `<svg viewBox="0 0 60 60" fill="none"><polygon points="30,4 36,22 54,22 40,34 46,52 30,42 14,52 20,34 6,22 24,22" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`,
  spiral: `<svg viewBox="0 0 60 60" fill="none"><path d="M30 30 Q44 16 44 30 Q44 46 30 46 Q14 46 14 28 Q14 10 32 10 Q50 10 50 30" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/><circle cx="30" cy="30" r="2.5" fill="currentColor" opacity=".6"/></svg>`,
  vesica: `<svg viewBox="0 0 60 60" fill="none"><circle cx="22" cy="30" r="16" stroke="currentColor" stroke-width="1.1" fill="none" opacity=".8"/><circle cx="38" cy="30" r="16" stroke="currentColor" stroke-width="1.1" fill="none" opacity=".8"/></svg>`,
}

export default function ShapePicker({
  selectedShapes,      // array of shapeIds in current blueprint (max 3)
  onAddShape,          // (shapeId) => void
  onRemoveShape,       // (index) => void
  maxShapes = 3,
}) {
  const [stats, setStats] = useState({
    spellsCount: 0,
    legendaryCount: 0,
    castFireWaterUnstable: false,
    hiddenGlyphsCount: 0,
  })

  // Load progress stats from localStorage to evaluate dynamic unlocks
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const spellsCast = parseInt(localStorage.getItem('wha_spells_cast_count') || '0', 10)
      const legendaryCast = parseInt(localStorage.getItem('wha_legendary_cast_count') || '0', 10)
      const fireWaterUnstable = localStorage.getItem('wha_cast_fire_water_unstable') === 'true'

      const unlockedGlyphsRaw = localStorage.getItem('wha_unlocked_glyphs')
      const unlockedGlyphs = unlockedGlyphsRaw ? JSON.parse(unlockedGlyphsRaw) : []
      const hiddenGlyphs = ['cinis', 'tempest', 'crepus', 'nexus'].filter(id => unlockedGlyphs.includes(id)).length

      setStats({
        spellsCount: spellsCast,
        legendaryCount: legendaryCast,
        castFireWaterUnstable: fireWaterUnstable,
        hiddenGlyphsCount: hiddenGlyphs,
      })
    } catch (e) {
      console.error('Error loading stats for unlocks:', e)
    }
  }, [selectedShapes])

  const shapesWithUnlockedStatus = getUnlockedShapes(stats)
  const unlockedShapes = shapesWithUnlockedStatus.filter(s => s.unlocked)
  const lockedShapes = shapesWithUnlockedStatus.filter(s => !s.unlocked)

  // Group unlocked by tier
  const grouped = TIER_ORDER.reduce((acc, tier) => {
    const shapes = unlockedShapes.filter(s => s.tier === tier)
    if (shapes.length > 0) acc[tier] = shapes
    return acc
  }, {})

  const canAddMore = selectedShapes.length < maxShapes

  return (
    <div className="flex flex-col border border-[#a07840] rounded-[4px] overflow-hidden h-full shadow-[2px_4px_12px_rgba(80,40,0,0.3)]" style={{ background: 'linear-gradient(135deg, #e8d5a3, #d4b483)' }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b-[3px] border-double border-[#a07840]">
        <span className="font-cinzel text-[10px] tracking-[2px] text-[#7a3e00] uppercase">
          Blueprint Shapes
        </span>
        <span className="ml-auto font-cinzel text-[10px] px-2 py-0.5 rounded-[2px]" style={{ background: '#4a1a00', color: '#f5e6c8', border: '1px solid #c9860b' }}>
          {selectedShapes.length}/{maxShapes}
        </span>
      </div>

      {/* Current blueprint */}
      {selectedShapes.length > 0 && (
        <div className="px-3 py-2.5 border-b-[3px] border-double border-[#a07840]">
          <p className="font-cinzel text-[9px] tracking-[2px] text-[#7a4f1a] italic uppercase mb-3">
            Active Blueprint
          </p>
          <div className="flex gap-2 items-center flex-wrap justify-center">
            {selectedShapes.map((shapeId, idx) => {
              const shape = SHAPES.find(s => s.id === shapeId)
              return (
                <div key={idx} className="flex items-center gap-2">
                  {idx > 0 && (
                    <span className="font-cinzel text-[12px] text-[#b8860b]">→</span>
                  )}
                  <div className="flex flex-col items-center gap-1">
                    <div 
                      onClick={() => onRemoveShape(idx)}
                      title="Click to remove"
                      className="cursor-pointer transition-transform hover:scale-105"
                    >
                      <WaxSeal
                        color="#8b1a1a"
                        iconSvg={SHAPE_SVGS[shapeId]}
                        size={56}
                        glowColor={idx === 0 ? '#f0c040' : idx === 1 ? '#d870db' : '#50c8ff'} // simple matching for auras
                      />
                    </div>
                    <span className="font-cinzel text-[8px] tracking-[1px] text-[#3b1f0a] uppercase font-bold mt-1">
                      {shape?.name} <span className="text-[#8b1a1a] cursor-pointer hover:text-red-500" onClick={() => onRemoveShape(idx)}>X</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Shape list */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">

        {Object.entries(grouped).map(([tier, shapes]) => (
          <div key={tier}>
            <p className="font-cinzel text-[10px] tracking-[2px] text-[#a07840] uppercase pb-1 mb-2 text-center">
              ── {TIER_LABELS[tier]} ──
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {shapes.map(shape => {
                const isSelected = selectedShapes.includes(shape.id)
                const isDisabled = !canAddMore && !isSelected
                return (
                  <ShapeCard
                    key={shape.id}
                    shape={shape}
                    svgPreview={SHAPE_SVGS[shape.id]}
                    isSelected={isSelected}
                    isDisabled={isDisabled}
                    onSelect={() => {
                      if (isDisabled) return
                      if (isSelected) {
                        const idx = selectedShapes.lastIndexOf(shape.id)
                        onRemoveShape(idx)
                      } else {
                        onAddShape(shape.id)
                      }
                    }}
                  />
                )
              })}
            </div>
          </div>
        ))}

        {/* Locked shapes — mystery slots */}
        {lockedShapes.length > 0 && (
          <div>
            <p className="font-cinzel text-[10px] tracking-[2px] text-[#a07840] uppercase pb-1 mb-2 text-center">
              ── Undiscovered ──
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {lockedShapes.map(shape => (
                <div
                  key={shape.id}
                  className="flex flex-col items-center gap-1 w-full cursor-not-allowed grayscale opacity-50"
                  title={shape.unlockCondition}
                >
                  <div className="relative w-[60px] h-[60px] rounded-[4px] flex items-center justify-center bg-[#1a0d00] border-[2px] border-[#5a3a00]">
                    <div className="absolute inset-[3px] border border-[#5a3a00] opacity-60 rounded-[2px]" />
                    <div className="w-8 h-8 flex items-center justify-center text-[22px] text-[#5a3a00] font-bold">?</div>
                  </div>
                  <span className="font-cinzel text-[9px] text-[#3b1f0a] font-bold uppercase tracking-wide mt-1">???</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ── SHAPE CARD ────────────────────────────────────
function ShapeCard({ shape, svgPreview, isSelected, isDisabled, onSelect }) {
  return (
    <button
      onClick={onSelect}
      disabled={isDisabled}
      title={shape.quality}
      className={`
        flex flex-col items-center gap-1 w-full
        transition-all duration-200 text-center select-none group
        ${isDisabled ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className={`
        relative w-[60px] h-[60px] rounded-[4px] flex items-center justify-center transition-all duration-300
        bg-[#1a0d00] border-[2px] border-[#c9860b] shadow-[0_4px_8px_rgba(0,0,0,0.4)]
        ${isSelected ? 'shadow-[0_0_15px_#f0c040] border-[#f0c040]' : 'group-hover:border-[#f0c040] group-hover:shadow-[0_0_10px_#f0c040]'}
      `}>
        <div className="absolute inset-[3px] border border-[#a07840] opacity-60 rounded-[2px] pointer-events-none" />

        <div
          className={`w-8 h-8 ${isSelected ? 'text-[#f5e6c8] drop-shadow-[0_0_6px_#f0c040]' : 'text-[#c9a55a]'}`}
          dangerouslySetInnerHTML={{ __html: svgPreview ?? '' }}
        />
      </div>
      <span className="font-cinzel text-[10px] leading-tight text-[#3b1f0a] font-bold uppercase mt-1">
        {shape.name}
      </span>
    </button>
  )
}
