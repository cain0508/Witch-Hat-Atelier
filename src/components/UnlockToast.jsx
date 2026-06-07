// ═══════════════════════════════════════════════
//  UNLOCK TOAST — Dramatic glyph reveal animation
//  Shows when a new glyph is discovered.
//  Fades in from center, holds, then fades out.
// ═══════════════════════════════════════════════

'use client'

import { useEffect, useState } from 'react'

export default function UnlockToast({ unlock, onDismiss }) {
  const [phase, setPhase] = useState('enter') // enter → hold → exit

  useEffect(() => {
    if (!unlock) return

    // enter → hold after 600ms
    const t1 = setTimeout(() => setPhase('hold'), 600)
    // hold → exit after 4s
    const t2 = setTimeout(() => setPhase('exit'), 4000)
    // dismiss after exit animation
    const t3 = setTimeout(() => { onDismiss?.(); setPhase('enter') }, 4800)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [unlock])

  if (!unlock) return null

  const { glyph } = unlock

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{ background: phase === 'hold' ? 'rgba(14,10,26,0.7)' : 'rgba(14,10,26,0)', transition: 'background 0.6s ease' }}
    >
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0 pointer-events-auto" onClick={onDismiss} />

      {/* Card */}
      <div
        className="relative pointer-events-auto flex flex-col items-center gap-4 p-8 rounded-2xl border"
        style={{
          background:   'rgba(18,12,35,0.95)',
          borderColor:  glyph.color,
          boxShadow:    `0 0 60px ${glyph.color}40, 0 0 120px ${glyph.color}20`,
          maxWidth:     340,
          opacity:      phase === 'enter' ? 0 : phase === 'hold' ? 1 : 0,
          transform:    phase === 'enter' ? 'scale(0.85) translateY(20px)' : phase === 'hold' ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-10px)',
          transition:   'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        {/* Discovery label */}
        <div
          className="font-cinzel text-[9px] tracking-[4px] uppercase"
          style={{ color: glyph.color }}
        >
          ✦ New Sigil Discovered ✦
        </div>

        {/* Glyph icon — large */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center border-2"
          style={{
            borderColor: glyph.color,
            background:  `${glyph.color}12`,
            boxShadow:   `0 0 30px ${glyph.color}30`,
          }}
          dangerouslySetInnerHTML={{
            __html: glyph.svg.replace('viewBox="0 0 30 30"', 'viewBox="0 0 30 30" width="60" height="60"')
          }}
        />

        {/* Glyph name */}
        <div>
          <h2 className="font-cinzel text-[22px] font-bold text-center" style={{ color: glyph.color }}>
            {glyph.name}
          </h2>
          <p className="font-cinzel text-[9px] tracking-[2px] text-center uppercase mt-1"
             style={{ color: `${glyph.color}80` }}>
            {glyph.element} · {glyph.type}
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px" style={{ background: `linear-gradient(to right, transparent, ${glyph.color}40, transparent)` }} />

        {/* Effect */}
        <p className="text-[13px] text-center text-[#e8d090]" style={{ fontFamily: 'var(--font-im-fell, serif)', fontStyle: 'italic' }}>
          {glyph.effect}
        </p>

        {/* Discovery lore */}
        {glyph.discoveryLore && (
          <p className="text-[12px] text-center text-[#a09ab8] leading-relaxed"
             style={{ fontFamily: 'var(--font-im-fell, serif)', fontStyle: 'italic' }}>
            "{glyph.discoveryLore}"
          </p>
        )}

        {/* Dismiss hint */}
        <p className="font-cinzel text-[8px] tracking-[2px] text-[#6b6080] uppercase">
          Click anywhere to continue
        </p>

        {/* Animated ring */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            border:    `1px solid ${glyph.color}`,
            opacity:   0.3,
            animation: 'ping 2s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  )
}
