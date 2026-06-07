// ═══════════════════════════════════════════════
//  NEATNESS METER — Score display + duration pips
//  Shows ring, sigil, balance sub-scores and
//  the overall neatness grade + spell duration.
// ═══════════════════════════════════════════════

'use client'

import { neatnessLabel, neatnessColor } from '@/lib/spellLogic'

export default function NeatnessMeter({ neatness, duration }) {

  // Nothing to show until center glyph is placed
  if (!neatness) {
    return (
      <div className="w-full space-y-3">
        <EmptyBar label="Circle Neatness" />
        <DurationPips pips={0} label="—" color="#6b6080" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">

      {/* Overall neatness bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-cinzel text-[9px] tracking-[2px] text-[#6b6080] uppercase">
            Circle Neatness
          </span>
          <span
            className="font-cinzel text-[12px] font-semibold"
            style={{ color: neatnessColor(neatness.overall) }}
          >
            {neatnessLabel(neatness.overall)} · {neatness.overall}%
          </span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${neatness.overall}%`,
              background: neatnessColor(neatness.overall),
            }}
          />
        </div>
      </div>

      {/* Duration pips */}
      <DurationPips
        pips={duration?.pips ?? 0}
        label={duration?.label ?? '—'}
        color={duration?.color ?? '#6b6080'}
      />

      {/* Sub-score breakdown */}
      <div className="bg-[rgba(45,27,105,0.15)] border border-[rgba(201,168,76,0.08)]
                      rounded-lg p-2.5 space-y-1.5">
        <SubScoreRow label="Ring Alignment" value={neatness.ring} />
        <SubScoreRow label="Sigil Precision" value={neatness.sigil} />
        <SubScoreRow label="Circle Balance"  value={neatness.balance} />
      </div>

    </div>
  )
}

// ── DURATION PIPS ────────────────────────────────
// 8 small squares — lit ones show spell duration

function DurationPips({ pips, label, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-cinzel text-[9px] tracking-[2px] text-[#6b6080] uppercase whitespace-nowrap">
        Duration
      </span>
      <div className="flex gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm border transition-all duration-300"
            style={{
              background:   i < pips ? `${color}30` : 'rgba(255,255,255,0.03)',
              borderColor:  i < pips ? color         : 'rgba(201,168,76,0.12)',
              boxShadow:    i < pips && i < 3 ? `0 0 5px ${color}50` : 'none',
            }}
          />
        ))}
      </div>
      <span
        className="font-cinzel text-[9px] tracking-[1px]"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  )
}

// ── SUB SCORE ROW ────────────────────────────────
// Single breakdown bar — ring / sigil / balance

function SubScoreRow({ label, value }) {
  const color = neatnessColor(value)

  return (
    <div className="flex items-center gap-2">
      <span className="font-cinzel text-[8px] text-[#6b6080] w-24 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span
        className="font-cinzel text-[8px] w-7 text-right"
        style={{ color }}
      >
        {value}%
      </span>
    </div>
  )
}

// ── EMPTY BAR ────────────────────────────────────
// Placeholder before any glyphs are placed

function EmptyBar({ label }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-cinzel text-[9px] tracking-[2px] text-[#6b6080] uppercase">
          {label}
        </span>
        <span className="font-cinzel text-[12px] text-[#6b6080]">—</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full" />
    </div>
  )
}
