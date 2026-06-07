// ═══════════════════════════════════════════════
//  SAVE BUTTON — Saves spell to community grimoire
//  Shows after a spell is successfully cast.
// ═══════════════════════════════════════════════

'use client'

import { useState } from 'react'

export default function SaveButton({ spell, placedGlyphs, spellState }) {
  const [status, setStatus] = useState('idle') // idle | saving | saved | error

  if (!spell) return null

  async function handleSave() {
    if (status !== 'idle') return
    setStatus('saving')

    try {
      const res = await fetch('/api/cast', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          placedGlyphs,
          saveToGrimoire: true,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('saved')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <button
      onClick={handleSave}
      disabled={status !== 'idle'}
      className={`
        font-cinzel text-[9px] tracking-[1.5px] uppercase
        px-4 py-2 rounded-full border transition-all
        ${status === 'saved'
          ? 'border-[rgba(78,205,196,0.4)] text-[#4ecdc4] bg-[rgba(78,205,196,0.08)] cursor-default'
          : status === 'error'
          ? 'border-[rgba(196,75,48,0.4)] text-[#e8593c] cursor-default'
          : status === 'saving'
          ? 'border-[rgba(201,168,76,0.2)] text-[#6b6080] cursor-wait'
          : 'border-[rgba(201,168,76,0.2)] text-[#6b6080] hover:border-[rgba(201,168,76,0.4)] hover:text-[#c9a84c] cursor-pointer'
        }
      `}
    >
      {status === 'saved'  ? '✦ Saved to Grimoire'  :
       status === 'saving' ? 'Saving…'               :
       status === 'error'  ? 'Save failed'           :
       'Save to Grimoire'}
    </button>
  )
}
