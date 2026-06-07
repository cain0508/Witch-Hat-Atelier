// ═══════════════════════════════════════════════
//  GRIMOIRE PAGE — /grimoire
//  Community spell library
//  Browse, filter, and like spells
// ═══════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const ELEMENTS = ['all','fire','water','wind','earth','light','shadow','time']
const RARITIES = ['all','common','rare','legendary','unstable']

const ELEMENT_COLORS = {
  fire:'#e8593c', water:'#3b8bd4', wind:'#5cb85c',
  earth:'#a0783c', light:'#c9a84c', shadow:'#9b59b6',
  time:'#4ecdc4', unknown:'#6b6080',
}

const RARITY_STYLES = {
  common:   { bg:'rgba(160,154,184,0.1)', border:'rgba(160,154,184,0.25)', text:'#a09ab8' },
  rare:     { bg:'rgba(78,205,196,0.1)',  border:'rgba(78,205,196,0.35)',  text:'#4ecdc4' },
  legendary:{ bg:'rgba(201,168,76,0.12)', border:'rgba(201,168,76,0.4)',   text:'#c9a84c' },
  unstable: { bg:'rgba(196,75,48,0.1)',   border:'rgba(196,75,48,0.35)',   text:'#e8593c' },
}

export default function GrimoirePage() {
  const [spells,      setSpells]      = useState([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [element,     setElement]     = useState('all')
  const [rarity,      setRarity]      = useState('all')
  const [page,        setPage]        = useState(1)
  const [totalPages,  setTotalPages]  = useState(1)
  const [likedSpells, setLikedSpells] = useState([])

  useEffect(() => {
    fetchSpells()
  }, [element, rarity, page])

  async function fetchSpells() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ element, rarity, page })
      const res    = await fetch(`/api/grimoire?${params}`)
      const data   = await res.json()
      if (data.success) {
        setSpells(data.spells)
        setTotalPages(data.totalPages)
      }
    } catch (err) {
      console.error('Failed to load grimoire:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLike(spellId) {
    if (likedSpells.includes(spellId)) return
    setLikedSpells(prev => [...prev, spellId])
    setSpells(prev => prev.map(s =>
      s._id === spellId ? { ...s, likes: (s.likes ?? 0) + 1 } : s
    ))
    await fetch('/api/grimoire', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ spellId }),
    })
  }

  return (
    <main className="min-h-screen bg-[#0c0917] text-[#e8e0d0] relative">

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none z-0"
           style={{ background:'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(45,27,105,0.55) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-[1100px] mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(201,168,76,0.18)]">
          <div>
            <p className="font-cinzel text-[9px] tracking-[3px] text-[#c9a84c] opacity-70 uppercase mb-1">
              ✦ Community ✦
            </p>
            <h1 className="font-cinzel text-[24px] font-bold text-[#e8d090]">
              The Grimoire
            </h1>
            <p className="text-[12px] italic text-[#6b6080]"
               style={{ fontFamily:'var(--font-im-fell, serif)' }}>
              Spells discovered by witches across the atelier
            </p>
          </div>
          <Link
            href="/"
            className="font-cinzel text-[10px] tracking-[1.5px] uppercase px-4 py-2 rounded-full border border-[rgba(201,168,76,0.25)] text-[#c9a84c] hover:bg-[rgba(201,168,76,0.08)] transition-all"
          >
            ← Forge
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">

          {/* Element filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-cinzel text-[8px] tracking-[2px] text-[#6b6080] uppercase">Element</span>
            {ELEMENTS.map(el => (
              <button
                key={el}
                onClick={() => { setElement(el); setPage(1) }}
                className="font-cinzel text-[8px] tracking-[1px] uppercase px-3 py-1.5 rounded-full border transition-all"
                style={{
                  borderColor: element === el
                    ? (ELEMENT_COLORS[el] ?? '#c9a84c')
                    : 'rgba(201,168,76,0.15)',
                  color: element === el
                    ? (ELEMENT_COLORS[el] ?? '#c9a84c')
                    : '#6b6080',
                  background: element === el
                    ? `${ELEMENT_COLORS[el] ?? '#c9a84c'}12`
                    : 'transparent',
                }}
              >
                {el}
              </button>
            ))}
          </div>

          {/* Rarity filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-cinzel text-[8px] tracking-[2px] text-[#6b6080] uppercase">Rarity</span>
            {RARITIES.map(r => {
              const rs = RARITY_STYLES[r]
              return (
                <button
                  key={r}
                  onClick={() => { setRarity(r); setPage(1) }}
                  className="font-cinzel text-[8px] tracking-[1px] uppercase px-3 py-1.5 rounded-full border transition-all"
                  style={{
                    borderColor: rarity === r ? (rs?.border ?? '#c9a84c') : 'rgba(201,168,76,0.15)',
                    color:       rarity === r ? (rs?.text  ?? '#c9a84c') : '#6b6080',
                    background:  rarity === r ? (rs?.bg    ?? 'transparent') : 'transparent',
                  }}
                >
                  {r}
                </button>
              )
            })}
          </div>

        </div>

        {/* Spell grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-[rgba(201,168,76,0.2)] border-t-[#c9a84c] animate-spin mr-3"/>
            <span className="font-cinzel text-[11px] text-[#6b6080] tracking-[2px]">Reading the grimoire…</span>
          </div>
        ) : spells.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl opacity-20 mb-4">◎</div>
            <p className="font-cinzel text-[12px] text-[#6b6080]">No spells found. Be the first to cast.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {spells.map(spell => (
              <SpellCard
                key={spell._id}
                spell={spell}
                isLiked={likedSpells.includes(spell._id)}
                onLike={() => handleLike(spell._id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p-1))}
              disabled={page === 1}
              className="font-cinzel text-[9px] tracking-[1px] uppercase px-4 py-2 rounded-full border border-[rgba(201,168,76,0.2)] text-[#6b6080] disabled:opacity-30 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all"
            >
              ← Prev
            </button>
            <span className="font-cinzel text-[9px] text-[#6b6080]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p+1))}
              disabled={page === totalPages}
              className="font-cinzel text-[9px] tracking-[1px] uppercase px-4 py-2 rounded-full border border-[rgba(201,168,76,0.2)] text-[#6b6080] disabled:opacity-30 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all"
            >
              Next →
            </button>
          </div>
        )}

      </div>
    </main>
  )
}

// ── SPELL CARD ───────────────────────────────────
function SpellCard({ spell, isLiked, onLike }) {
  const rs = RARITY_STYLES[spell.rarity] ?? RARITY_STYLES.common
  const ec = ELEMENT_COLORS[spell.element] ?? '#6b6080'

  return (
    <div className="bg-[rgba(14,10,26,0.8)] border border-[rgba(201,168,76,0.15)] rounded-xl p-4 flex flex-col gap-2 hover:border-[rgba(201,168,76,0.3)] transition-all">

      {/* Rarity + element */}
      <div className="flex items-center justify-between">
        <span
          className="font-cinzel text-[7px] tracking-[1.5px] uppercase px-2 py-0.5 rounded-full border"
          style={{ background:rs.bg, borderColor:rs.border, color:rs.text }}
        >
          {spell.rarity}
        </span>
        <span className="font-cinzel text-[7px] tracking-[1px] uppercase" style={{ color:ec }}>
          {spell.element}
        </span>
      </div>

      {/* Spell name */}
      <h3 className="font-cinzel text-[13px] font-semibold text-[#e8d090] leading-tight">
        {spell.spellName}
      </h3>

      {/* Duration pips */}
      <div className="flex gap-1">
        {Array.from({ length: 8 }).map((_,i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-sm border"
            style={{
              background:  i < spell.durationPips ? `${ec}30` : 'rgba(255,255,255,0.03)',
              borderColor: i < spell.durationPips ? ec : 'rgba(201,168,76,0.1)',
            }}
          />
        ))}
        <span className="font-cinzel text-[7px] ml-1" style={{ color:ec }}>
          {spell.durationLabel}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[rgba(201,168,76,0.15)] to-transparent"/>

      {/* Lore */}
      <p className="text-[11px] italic text-[#a09ab8] leading-relaxed line-clamp-3"
         style={{ fontFamily:'var(--font-im-fell, serif)' }}>
        {spell.lore}
      </p>

      {/* Footer — date + likes */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-[rgba(201,168,76,0.08)]">
        <span className="font-cinzel text-[7px] text-[#6b6080]">
          {new Date(spell.createdAt).toLocaleDateString()}
        </span>
        <button
          onClick={onLike}
          className={`flex items-center gap-1 font-cinzel text-[8px] tracking-[1px] px-2 py-1 rounded-full border transition-all ${
            isLiked
              ? 'border-[rgba(201,168,76,0.4)] text-[#c9a84c] bg-[rgba(201,168,76,0.08)]'
              : 'border-[rgba(201,168,76,0.15)] text-[#6b6080] hover:border-[rgba(201,168,76,0.3)] hover:text-[#c9a84c]'
          }`}
        >
          ✦ {spell.likes ?? 0}
        </button>
      </div>

    </div>
  )
}
