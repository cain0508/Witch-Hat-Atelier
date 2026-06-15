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
  common:   { bg: '#c9a55a',  border: '#a07840', text: '#3b1f0a' },
  rare:     { bg: '#b8935a',   border: '#8b5a2b',  text: '#2b1500' },
  legendary:{ bg: '#8b1a1a',  border: '#5a0a0a',   text: '#f5e6c8' },
  unstable: { bg: '#4a1a00',    border: '#c9860b',   text: '#f5e6c8' },
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
    <main className="min-h-screen bg-[#d4b483] text-[#3b1f0a] relative overflow-x-hidden">

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none z-0"
           style={{ background:'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,165,90,0.15) 0%, transparent 70%)' }}
      />
      {/* Decorative rune strip along the bottom */}
      <div className="fixed bottom-0 left-0 w-full overflow-hidden opacity-30 pointer-events-none select-none" style={{ color: '#b8860b', fontSize: '11px', letterSpacing: '6px', whiteSpace: 'nowrap' }}>
        {'ᚠᚢᚦᚨᚱᚲ'.repeat(50)}
      </div>

      <div className="relative z-10 max-w-[1100px] mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b-[3px] border-double border-[#a07840]">
          <div>
            <p className="font-cinzel text-[9px] tracking-[3px] text-[#7a4f1a] uppercase mb-1">
              ✦ Community ✦
            </p>
            <h1 className="font-cinzel text-[24px] font-bold text-[#3b1f0a]" style={{ textShadow: '0 1px 0 rgba(255,220,150,0.4)' }}>
              The Grimoire
            </h1>
            <p className="text-[12px] italic text-[#7a4f1a]"
               style={{ fontFamily:'var(--font-im-fell, serif)' }}>
              Spells discovered by witches across the atelier
            </p>
          </div>
          <Link
            href="/"
            className="font-cinzel text-[10px] tracking-[1.5px] uppercase px-4 py-2 rounded-[3px] border-[2px] border-[#7a4f1a] bg-[#c9a55a] text-[#2b1500] hover:bg-[#b8935a] transition-all shadow-[2px_4px_12px_rgba(80,40,0,0.3)]"
          >
            ← Forge
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">

          {/* Element filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-cinzel text-[8px] tracking-[2px] text-[#5c3317] uppercase mr-2">Element</span>
            {ELEMENTS.map(el => (
              <button
                key={el}
                onClick={() => { setElement(el); setPage(1) }}
                className="font-cinzel text-[8px] tracking-[1.5px] uppercase px-4 py-1.5 rounded-[12px] border-[2px] transition-all duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),_0_2px_4px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95"
                style={{
                  borderColor: element === el ? (ELEMENT_COLORS[el] ?? '#a07840') : '#7a4f1a',
                  color: element === el ? '#f5e6c8' : '#3b1f0a',
                  background: element === el 
                    ? `linear-gradient(135deg, ${ELEMENT_COLORS[el] ?? '#a07840'}, #2b1500)` 
                    : 'linear-gradient(135deg, #c9a55a, #a07840)',
                }}
              >
                {el}
              </button>
            ))}
          </div>

          {/* Rarity filter */}
          <div className="flex items-center gap-2 flex-wrap ml-0 md:ml-4">
            <span className="font-cinzel text-[8px] tracking-[2px] text-[#5c3317] uppercase mr-2">Rarity</span>
            {RARITIES.map(r => {
              const rs = RARITY_STYLES[r]
              return (
                <button
                  key={r}
                  onClick={() => { setRarity(r); setPage(1) }}
                  className="font-cinzel text-[8px] tracking-[1.5px] uppercase px-4 py-1.5 rounded-[12px] border-[2px] transition-all duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),_0_2px_4px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95"
                  style={{
                    borderColor: rarity === r ? rs?.border : '#7a4f1a',
                    color:       rarity === r ? rs?.text  : '#3b1f0a',
                    background:  rarity === r 
                      ? `linear-gradient(135deg, ${rs?.bg}, #2b1500)`
                      : 'linear-gradient(135deg, #c9a55a, #a07840)',
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
            <div className="w-8 h-8 rounded-full border-[3px] border-[#a07840] border-t-[#3b1f0a] animate-spin mr-3"/>
            <span className="font-cinzel text-[11px] text-[#5c3317] tracking-[2px]">Reading the grimoire…</span>
          </div>
        ) : spells.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 bg-[rgba(139,26,26,0.02)] border border-dashed border-[#a07840] rounded-xl mx-auto max-w-2xl mt-8">
            <div className="text-[48px] opacity-30 text-[#b8860b] mb-4" style={{ filter: 'drop-shadow(0 0 10px rgba(184,134,11,0.5))' }}>◈</div>
            <h3 className="font-cinzel text-[16px] text-[#5c3317] font-bold mb-2">No Spells Discovered</h3>
            <p className="text-[12px] text-[#7a4f1a] italic text-center max-w-sm" style={{ fontFamily: 'var(--font-im-fell, serif)' }}>
              The pages of the grimoire are blank for this incantation. Be the first witch in the atelier to weave it.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spells.map((spell, index) => (
              <div 
                key={spell._id} 
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
              >
                <SpellCard
                  spell={spell}
                  isLiked={likedSpells.includes(spell._id)}
                  onLike={() => handleLike(spell._id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p-1))}
              disabled={page === 1}
              className="font-cinzel text-[9px] tracking-[1px] uppercase px-4 py-2 rounded-[3px] border-[2px] border-[#7a4f1a] text-[#2b1500] bg-[#c9a55a] disabled:opacity-30 hover:bg-[#b8935a] transition-all shadow-[2px_4px_12px_rgba(80,40,0,0.3)]"
            >
              ← Prev
            </button>
            <span className="font-cinzel text-[9px] text-[#5c3317]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p+1))}
              disabled={page === totalPages}
              className="font-cinzel text-[9px] tracking-[1px] uppercase px-4 py-2 rounded-[3px] border-[2px] border-[#7a4f1a] text-[#2b1500] bg-[#c9a55a] disabled:opacity-30 hover:bg-[#b8935a] transition-all shadow-[2px_4px_12px_rgba(80,40,0,0.3)]"
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
  const ec = ELEMENT_COLORS[spell.element] ?? '#a07840'

  return (
    <div className="border border-[#a07840] rounded-[4px] p-4 flex flex-col gap-2 hover:shadow-[0_0_8px_rgba(180,140,60,0.5)] transition-all relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #e8d5a3, #d4b483)' }}>

      {/* Rarity + element */}
      <div className="flex items-center justify-between">
        <span
          className="font-cinzel text-[7px] tracking-[1.5px] uppercase px-2 py-0.5 rounded-[2px] border"
          style={{ background:rs.bg, borderColor:rs.border, color:rs.text }}
        >
          {spell.rarity}
        </span>
        <span className="font-cinzel text-[7px] tracking-[1px] uppercase" style={{ color:ec }}>
          {spell.element}
        </span>
      </div>

      {/* Spell name */}
      <h3 className="font-cinzel text-[13px] font-semibold text-[#3b1f0a] leading-tight">
        {spell.spellName}
      </h3>

      {/* Duration pips */}
      <div className="flex gap-1">
        {Array.from({ length: 8 }).map((_,i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-[2px] border"
            style={{
              background:  i < spell.durationPips ? `${ec}` : 'rgba(160,120,64,0.1)',
              borderColor: i < spell.durationPips ? ec : '#a07840',
            }}
          />
        ))}
        <span className="font-cinzel text-[7px] ml-1" style={{ color:ec }}>
          {spell.durationLabel}
        </span>
      </div>

      {/* Divider */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#7a3e00] to-transparent opacity-40"/>

      {/* Lore */}
      <p className="text-[11px] italic text-[#2b1500] leading-relaxed line-clamp-3"
         style={{ fontFamily:'var(--font-im-fell, serif)' }}>
        {spell.lore}
      </p>

      {/* Footer — date + likes */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t-[2px] border-double border-[#a07840]">
        <span className="font-cinzel text-[7px] text-[#5c3317]">
          {new Date(spell.createdAt).toLocaleDateString()}
        </span>
        <button
          onClick={onLike}
          className={`flex items-center gap-1 font-cinzel text-[8px] tracking-[1px] px-2 py-1 rounded-[3px] border-[1.5px] transition-all ${
            isLiked
              ? 'border-[#8b1a1a] text-[#f5e6c8] bg-[#7a1a1a] shadow-[0_0_6px_rgba(122,26,26,0.5)]'
              : 'border-[#7a4f1a] text-[#2b1500] bg-[#c9a55a] hover:bg-[#b8935a]'
          }`}
        >
          ✦ {spell.likes ?? 0}
        </button>
      </div>

    </div>
  )
}
