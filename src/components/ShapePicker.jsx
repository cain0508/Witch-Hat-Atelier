// ═══════════════════════════════════════════════
//  SHAPE PICKER — Select blueprint shape
//  Shows all unlocked shapes grouped by tier.
//  User clicks a shape to add it to the blueprint.
// ═══════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { SHAPES, SHAPE_TIERS, getUnlockedShapes } from '@/lib/shapes'

const TIER_ORDER = [
  SHAPE_TIERS.BASE,
  SHAPE_TIERS.BASIC,
  SHAPE_TIERS.ADVANCED,
  SHAPE_TIERS.MASTER,
  SHAPE_TIERS.SPECIAL,
  SHAPE_TIERS.RARE,
]

const TIER_LABELS = {
  base:     'Foundation',
  basic:    'Basic',
  advanced: 'Advanced',
  master:   'Master',
  special:  'Special',
  rare:     'Rare',
}

// SVG previews for each shape
const SHAPE_SVGS = {
  circle: `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="30" r="22" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 4"/><circle cx="30" cy="30" r="4" fill="currentColor" opacity=".5"/></svg>`,
  triangle: `<svg viewBox="0 0 60 60" fill="none"><polygon points="30,8 54,50 6,50" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="30" cy="30" r="3" fill="currentColor" opacity=".5"/></svg>`,
  pentagon: `<svg viewBox="0 0 60 60" fill="none"><polygon points="30,6 56,24 46,52 14,52 4,24" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="30" cy="32" r="3" fill="currentColor" opacity=".5"/></svg>`,
  hexagon:  `<svg viewBox="0 0 60 60" fill="none"><polygon points="30,6 52,18 52,42 30,54 8,42 8,18" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`,
  trispell: `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="18" r="13" stroke="currentColor" stroke-width="1" fill="none" opacity=".8"/><circle cx="19" cy="38" r="13" stroke="currentColor" stroke-width="1" fill="none" opacity=".8"/><circle cx="41" cy="38" r="13" stroke="currentColor" stroke-width="1" fill="none" opacity=".8"/></svg>`,
  square:   `<svg viewBox="0 0 60 60" fill="none"><rect x="10" y="10" width="40" height="40" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="10" cy="10" r="2.5" fill="currentColor" opacity=".6"/><circle cx="50" cy="10" r="2.5" fill="currentColor" opacity=".6"/><circle cx="50" cy="50" r="2.5" fill="currentColor" opacity=".6"/><circle cx="10" cy="50" r="2.5" fill="currentColor" opacity=".6"/></svg>`,
  star:     `<svg viewBox="0 0 60 60" fill="none"><polygon points="30,4 36,22 54,22 40,34 46,52 30,42 14,52 20,34 6,22 24,22" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`,
  spiral:   `<svg viewBox="0 0 60 60" fill="none"><path d="M30 30 Q44 16 44 30 Q44 46 30 46 Q14 46 14 28 Q14 10 32 10 Q50 10 50 30" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/><circle cx="30" cy="30" r="2.5" fill="currentColor" opacity=".6"/></svg>`,
  vesica:   `<svg viewBox="0 0 60 60" fill="none"><circle cx="22" cy="30" r="16" stroke="currentColor" stroke-width="1.1" fill="none" opacity=".8"/><circle cx="38" cy="30" r="16" stroke="currentColor" stroke-width="1.1" fill="none" opacity=".8"/></svg>`,
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
    <div className="flex flex-col bg-[#0e0a1a] border border-[rgba(201,168,76,0.22)] rounded-xl overflow-hidden h-full">

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[rgba(201,168,76,0.1)] bg-[rgba(201,168,76,0.02)]">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <polygon points="6,1 11,4 11,8 6,11 1,8 1,4" stroke="#c9a84c" strokeWidth="1" fill="none"/>
        </svg>
        <span className="font-cinzel text-[10px] tracking-[2px] text-[#c9a84c] uppercase">
          Blueprint Shapes
        </span>
        <span className="ml-auto font-cinzel text-[8px] text-[#6b6080]">
          {selectedShapes.length}/{maxShapes}
        </span>
      </div>

      {/* Current blueprint */}
      {selectedShapes.length > 0 && (
        <div className="px-3 py-2.5 border-b border-[rgba(201,168,76,0.08)] bg-[rgba(45,27,105,0.1)]">
          <p className="font-cinzel text-[8px] tracking-[2px] text-[#6b6080] uppercase mb-2">
            Active Blueprint
          </p>
          <div className="flex gap-2 items-center flex-wrap">
            {selectedShapes.map((shapeId, idx) => {
              const shape = SHAPES.find(s => s.id === shapeId)
              return (
                <div key={idx} className="flex items-center gap-1">
                  {idx > 0 && (
                    <span className="font-cinzel text-[8px] text-[#6b6080]">→</span>
                  )}
                  <div
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg border cursor-pointer hover:border-[rgba(196,75,48,0.4)] transition-all"
                    style={{ borderColor: `${shape?.color}40`, background: `${shape?.color}10` }}
                    onClick={() => onRemoveShape(idx)}
                    title="Click to remove"
                  >
                    <div
                      className="w-4 h-4"
                      style={{ color: shape?.color }}
                      dangerouslySetInnerHTML={{ __html: SHAPE_SVGS[shapeId] ?? '' }}
                    />
                    <span className="font-cinzel text-[8px]" style={{ color: shape?.color }}>
                      {shape?.name}
                    </span>
                    <span className="text-[#6b6080] text-[9px]">×</span>
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
            <p className="font-cinzel text-[8px] tracking-[2px] text-[#6b6080] uppercase pb-1.5 mb-2 border-b border-[rgba(201,168,76,0.08)]">
              {TIER_LABELS[tier]}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {shapes.map(shape => {
                const isSelected  = selectedShapes.includes(shape.id)
                const isDisabled  = !canAddMore && !isSelected
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
            <p className="font-cinzel text-[8px] tracking-[2px] text-[#6b6080] uppercase pb-1.5 mb-2 border-b border-[rgba(201,168,76,0.08)]">
              Undiscovered
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {lockedShapes.map(shape => (
                <div
                  key={shape.id}
                  className="flex flex-col items-center p-2 rounded-lg border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.01)] opacity-35 cursor-not-allowed"
                  title={shape.unlockCondition}
                >
                  <div className="w-8 h-8 mb-1 flex items-center justify-center text-[18px] opacity-30">◈</div>
                  <span className="font-cinzel text-[8.5px] text-[#6b6080]">???</span>
                  <span className="font-cinzel text-[6.5px] text-[#6b6080] mt-1 text-center leading-tight opacity-70">
                    {shape.unlockCondition}
                  </span>
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
        flex flex-col items-center p-2 rounded-lg border w-full
        transition-all duration-200 text-center select-none
        ${isDisabled
          ? 'border-[rgba(255,255,255,0.05)] opacity-40 cursor-not-allowed'
          : isSelected
            ? 'border-[#c9a84c] bg-[rgba(201,168,76,0.12)] shadow-[0_0_12px_rgba(201,168,76,0.2)] cursor-pointer'
            : 'border-[rgba(201,168,76,0.15)] bg-[rgba(45,27,105,0.1)] hover:border-[#c9a84c] hover:bg-[rgba(45,27,105,0.28)] hover:-translate-y-px cursor-pointer'
        }
      `}
    >
      <div
        className="w-8 h-8 mb-1"
        style={{ color: isSelected ? '#c9a84c' : shape.color }}
        dangerouslySetInnerHTML={{ __html: svgPreview ?? '' }}
      />
      <span className="font-cinzel text-[8.5px] leading-tight" style={{ color: isSelected ? '#e8d090' : shape.color }}>
        {shape.name}
      </span>
      <span className="font-cinzel text-[6.5px] text-[#6b6080] mt-0.5 leading-tight">
        {shape.subtitle}
      </span>
      <div className="w-1 h-1 rounded-full mt-1" style={{ background: shape.color }}/>
    </button>
  )
}
